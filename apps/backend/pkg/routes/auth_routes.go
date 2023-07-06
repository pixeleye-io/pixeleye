package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/pixeleye-io/pixeleye/app/controllers"
)

func AuthRoutes(a *fiber.App) {

	// Create routes group.
	route := a.Group("/api/v1/auth")

	// Routes for POST method:
	route.Get("/login/:provider", controllers.LoginProvider)
	route.Get("/callback/:provider", controllers.LoginCallback)

}
