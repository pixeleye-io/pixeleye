package main

import (
	"log"
	"os"

	"github.com/pixeleye-io/pixeleye/pkg/configs"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
	"github.com/pixeleye-io/pixeleye/pkg/routes"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/pixeleye-io/pixeleye/platform/broker"

	"github.com/gofiber/fiber/v2"

	_ "github.com/create-go-app/fiber-go-template/docs" // load API Docs files (Swagger)

	_ "github.com/joho/godotenv/autoload" // load .env file automatically
)

//TODO - add error handling middleware to filter out non custom errors, log them, and return a generic error to the user

func main() {
	// Define Fiber config
	config := configs.FiberConfig()

	// Create
	amqpConnection := broker.ConnectAMPQ()
	defer amqpConnection.Close()
	ampqChannel := broker.CreateChannel(amqpConnection)
	defer ampqChannel.Close()

	go func() {
		messages := broker.SubscribeToQueue(ampqChannel, "test-queue", broker.BuildUpdate)

		// Build a welcome message.
		log.Println("Waiting for messages")

		// Make a channel to receive messages into infinite loop.
		forever := make(chan bool)

		go func() {
			for message := range messages {
				// For example, show received message in a console.
				log.Printf(" > Received message: %s\n", message.Body)
			}
		}()

		<-forever

	}()

	// Define a new Fiber app with config
	app := fiber.New(config)

	// Middleware
	middleware.FiberMiddleware(app) // Register Fiber's middleware for app

	// Routes
	routes.PingRoute(app)               // Register Ping route
	routes.QueueRoute(app, ampqChannel) // Register Queue route
	routes.PrivateRoutes(app)           // Register Private routes
	routes.NotFoundRoute(app)           // Register 404 Error route

	// Start server (with or without graceful shutdown).
	if os.Getenv("STAGE_STATUS") == "dev" {
		utils.StartServer(app)
	} else {
		utils.StartServerWithGracefulShutdown(app)
	}
}
