package main

import (
	"fmt"
	"os"

	"github.com/pixeleye-io/pixeleye/pkg/configs"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
	"github.com/pixeleye-io/pixeleye/pkg/routes"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/pixeleye-io/pixeleye/platform/broker"
	"github.com/pixeleye-io/pixeleye/platform/brokerTypes"

	"github.com/gofiber/fiber/v2"

	_ "github.com/create-go-app/fiber-go-template/docs" // load API Docs files (Swagger)

	_ "github.com/joho/godotenv/autoload" // load .env file automatically
)

//TODO - add error handling middleware to filter out non custom errors, log them, and return a generic error to the user

func main() {
	// Define Fiber config
	config := configs.FiberConfig()

	// Create rabbitmq
	connection := broker.GetConnection()
	defer broker.Close()

	quit := make(chan bool)
	count := 0
	go broker.SubscribeToQueue(connection, "", brokerTypes.BuildProcess, func(msg []byte) error {
		fmt.Println("Received a message: %s", string(msg))
		count += 1
		if count == 10 {
			quit <- true
		}
		return nil
	}, quit)

	// Define a new Fiber app with config
	app := fiber.New(config)

	// Middleware
	middleware.FiberMiddleware(app) // Register Fiber's middleware for app

	// Routes
	routes.PingRoute(app)     // Register Ping route
	routes.PrivateRoutes(app) // Register Private routes
	routes.NotFoundRoute(app) // Register 404 Error route

	// Start server (with or without graceful shutdown).
	if os.Getenv("STAGE_STATUS") == "dev" {
		utils.StartServer(app)
	} else {
		utils.StartServerWithGracefulShutdown(app)
	}
}
