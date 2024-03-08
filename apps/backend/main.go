package main

import (
	"os"

	"github.com/labstack/echo/v4"
	echoMiddleware "github.com/labstack/echo/v4/middleware"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"github.com/pixeleye-io/pixeleye/pkg/ingest"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
	"github.com/pixeleye-io/pixeleye/pkg/routes"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/pixeleye-io/pixeleye/platform/analytics"
	"github.com/pixeleye-io/pixeleye/platform/cron"

	"github.com/joho/godotenv"
)

func main() {

	if os.Getenv("STAGE_STATUS") == "" {
		if err := godotenv.Load("./../../.env"); err != nil {
			log.Info().Msg("No .env file found")
		}
	}

	// We want to clean up the analytics client when the server is shut down.
	defer analytics.CloseClient()

	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix

	e := echo.New()

	e.Use(middleware.Logger())
	e.Use(echoMiddleware.Recover())

	e.Use(echoMiddleware.CORSWithConfig(echoMiddleware.CORSConfig{
		AllowOrigins:     []string{os.Getenv("FRONTEND_URL")},
		AllowCredentials: true,
		ExposeHeaders:    []string{"Pixeleye-Location"},
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
	routes.WebhookRoutes(e)
	routes.SnapshotRoutes(e)

	cron.StartCron()

	// Start server (with or without graceful shutdown).
	if os.Getenv("STAGE_STATUS") == "dev" {
		zerolog.SetGlobalLevel(zerolog.DebugLevel)

		go ingest.StartIngestServer() // For small environments, we can start ingest server in the same process.
		e.Debug = true
		utils.StartServer(e)
	} else {
		zerolog.SetGlobalLevel(zerolog.InfoLevel)
		if os.Getenv("PIXELEYE_HOSTING") != "true" {
			go ingest.StartIngestServerWithGracefulShutdown()
		}
		utils.StartServerWithGracefulShutdown(e)
	}
}
