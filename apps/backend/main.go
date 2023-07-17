package main

import (
	"os"

	"github.com/labstack/echo/v4"
	echoMiddleware "github.com/labstack/echo/v4/middleware"

	"github.com/pixeleye-io/pixeleye/pkg/routes"
	"github.com/pixeleye-io/pixeleye/pkg/utils"

	_ "github.com/create-go-app/fiber-go-template/docs" // load API Docs files (Swagger)

	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load("./../../.env")

	proxyPort := os.Getenv("PROXY_PORT")
	if proxyPort == "" {
		proxyPort = "4000"
	}

	e := echo.New()

	// Global middleware
	e.Use(echoMiddleware.Logger())

	// Routes
	routes.HealthRoutes(e)
	routes.BuildRoutes(e)
	routes.UserRoutes(e)

	// Start server (with or without graceful shutdown).
	if os.Getenv("STAGE_STATUS") == "dev" {
		e.Debug = true
		utils.StartServer(e)
	} else {
		utils.StartServerWithGracefulShutdown(e)
	}
}
