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
	route.Post("/builds/create", controllers.CreateBuild)
	route.Post("/builds/:build_id/upload", controllers.UploadPartial)
	route.Post("/builds/:build_id/complete", controllers.UploadComplete)

	// Routes for GET method:
	route.Get("/builds/:build_id", controllers.GetBuild)
	route.Get("/user", controllers.GetCurrentUser)

}
