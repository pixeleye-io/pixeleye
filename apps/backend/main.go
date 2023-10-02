package main

import (
	"os"

	"github.com/labstack/echo/v4"
	echoMiddleware "github.com/labstack/echo/v4/middleware"
	"github.com/rs/zerolog"

	"github.com/pixeleye-io/pixeleye/pkg/ingest"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
	"github.com/pixeleye-io/pixeleye/pkg/routes"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/pixeleye-io/pixeleye/platform/cron"

	"github.com/joho/godotenv"
)

func main() {

	//nolint:errcheck
	godotenv.Load("./../../.env")

	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix

	e := echo.New()

	e.Use(middleware.Logger())
	e.Use(echoMiddleware.Recover())

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
	routes.BuildRoutes(e)
	routes.GitRoutes(e)
	routes.InviteRoutes(e)

	cron.StartCron()

	// Start server (with or without graceful shutdown).
	if os.Getenv("STAGE_STATUS") == "dev" {
		zerolog.SetGlobalLevel(zerolog.DebugLevel)

		go ingest.StartIngestServer() // For small environments, we can start ingest server in the same process.
		e.Debug = true
		utils.StartServer(e)
	} else {
		if os.Getenv("SELF_HOSTING") != "false" {
			go ingest.StartIngestServerWithGracefulShutdown()
		}
		utils.StartServerWithGracefulShutdown(e)
	}
}
