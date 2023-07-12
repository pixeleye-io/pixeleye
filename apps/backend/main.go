package main

import (
	"os"

	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/pkg/routes"
	"github.com/pixeleye-io/pixeleye/pkg/utils"

	_ "github.com/create-go-app/fiber-go-template/docs" // load API Docs files (Swagger)

	"github.com/joho/godotenv"
)

//TODO - add error handling middleware to filter out non custom errors, log them, and return a generic error to the user

func main() {
	godotenv.Load("./../../.env")

	e := echo.New()

	// // Middleware
	// middleware.FiberMiddleware(app) // Register Fiber's middleware for app

	// Routes
	routes.HealthRoutes(e) // Register Health routes
	routes.ProjectRoutes(e)

	// Start server (with or without graceful shutdown).
	if os.Getenv("STAGE_STATUS") == "dev" {
		utils.StartServer(e)
	} else {
		utils.StartServerWithGracefulShutdown(e)
	}
}
