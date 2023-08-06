package main

import (
	"os"

	"github.com/labstack/echo/v4"
	echoMiddleware "github.com/labstack/echo/v4/middleware"
	"github.com/rs/zerolog"

	_ "github.com/create-go-app/fiber-go-template/docs" // load API Docs files (Swagger)
	"github.com/pixeleye-io/pixeleye/pkg/ingest"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
	"github.com/pixeleye-io/pixeleye/pkg/routes"
	"github.com/pixeleye-io/pixeleye/pkg/utils"

	"github.com/joho/godotenv"
)

func main() {

	//nolint:errcheck
	godotenv.Load("./../../.env")

	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix

	e := echo.New()

	//TODO - get csrf working

	e.Use(middleware.Logger())

	e.Use(echoMiddleware.CORSWithConfig(echoMiddleware.CORSConfig{
		AllowOrigins:     []string{"http://localhost:5000", "http://localhost:4000", "http://localhost:3000"},
		AllowCredentials: true,
		AllowHeaders:     []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept}}))

	e.Use(echoMiddleware.Secure())

	// Routes
	routes.HealthRoutes(e)
	routes.ProjectTokenRoutes(e)
	routes.UserRoutes(e)
	routes.ProjectRoutes(e)
	routes.TeamRoutes(e)

	// Start server (with or without graceful shutdown).
	if os.Getenv("STAGE_STATUS") == "dev" {
		zerolog.SetGlobalLevel(zerolog.DebugLevel)

		go ingest.StartIngestServer()
		e.Debug = true
		utils.StartServer(e)
	} else {
		if os.Getenv("SELF_HOSTING") != "false" {
			go ingest.StartIngestServerWithGracefulShutdown()
		}
		utils.StartServerWithGracefulShutdown(e)
	}
}
