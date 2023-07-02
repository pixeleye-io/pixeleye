package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/pixeleye-io/pixeleye/app/controllers"
	amqp "github.com/rabbitmq/amqp091-go"
)

// PrivateRoutes func for describe group of private routes.
func PrivateRoutes(a *fiber.App, channelRabbitMQ *amqp.Channel) {
	// Create routes group.
	route := a.Group("/api/v1")

	// Routes for POST method:
	route.Post("/build/create", controllers.CreateBuild)
	route.Post("/build/:build_id/upload", controllers.UploadPartial)
	route.Post("/build/:build_id/complete", func(c *fiber.Ctx) error { return controllers.UploadComplete(c, channelRabbitMQ) })

	// Routes for GET method:
	route.Get("/build/:build_id", controllers.GetBuild)

}
