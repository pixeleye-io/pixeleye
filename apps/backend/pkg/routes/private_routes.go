package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/pixeleye-io/pixeleye/app/controllers"
)

// PrivateRoutes func for describe group of private routes.
func PrivateRoutes(a *fiber.App) {
	// Create routes group.
	route := a.Group("/api/v1")

	// Routes for POST method:
	route.Post("/build/create", controllers.CreateBuild)
	route.Post("/build/:build_id/upload", controllers.UploadPartial)

	// Routes for GET method:
	route.Get("/build/:build_id", controllers.GetBuild)

}
