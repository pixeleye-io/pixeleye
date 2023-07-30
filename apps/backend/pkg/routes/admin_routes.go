package routes

import (
	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
)

// These routes are protected by an api key. They provide admin access for managing the entire system.
// We need to make sure that the admin key is set in the environment variables.
func AdminRoutes(e *echo.Echo) {

	// Create routes group.
	v1 := e.Group("/v1")

	v1.Use(middleware.AdminAPI())

}
