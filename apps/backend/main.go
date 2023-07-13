package main

import (
	"fmt"
	"os"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"github.com/pixeleye-io/pixeleye/pkg/routes"
	"github.com/pixeleye-io/pixeleye/pkg/utils"

	_ "github.com/create-go-app/fiber-go-template/docs" // load API Docs files (Swagger)

	ory "github.com/ory/client-go"

	"github.com/joho/godotenv"
)

type App struct {
	ory *ory.APIClient
}

//TODO - add error handling middleware to filter out non custom errors, log them, and return a generic error to the user

func main() {
	godotenv.Load("./../../.env")

	proxyPort := os.Getenv("PROXY_PORT")
	if proxyPort == "" {
		proxyPort = "4000"
	}

	// register a new Ory client with the URL set to the Ory CLI Proxy
	// we can also read the URL from the env or a config file
	c := ory.NewConfiguration()
	c.Servers = ory.ServerConfigurations{{URL: fmt.Sprintf("http://localhost:%s/.ory", proxyPort)}}

	_ = &App{
		ory: ory.NewAPIClient(c),
	}

	e := echo.New()

	e.Use(middleware.Logger())

	// // Middleware
	// middleware.FiberMiddleware(app) // Register Fiber's middleware for app

	// Routes
	routes.HealthRoutes(e) // Register Health routes
	routes.ProjectRoutes(e)

	// Start server (with or without graceful shutdown).
	if os.Getenv("STAGE_STATUS") == "dev" {
		e.Debug = true
		utils.StartServer(e)
	} else {
		utils.StartServerWithGracefulShutdown(e)
	}
}
