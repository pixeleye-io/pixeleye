package routes

import (
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/pixeleye-io/pixeleye/app/controllers"
)

// These routes are protected by an api key. They're used by the pixeleye cli to upload builds.
func ProjectRoutes(e *echo.Echo) {

	// Create routes group.
	v1 := e.Group("/v1")

	v1.Use(middleware.KeyAuthWithConfig(middleware.KeyAuthConfig{
		Validator: func(key string, c echo.Context) (bool, error) {
			// TODO - add api key validation
			return true, nil
		},
	}))

	// Routes for POST method:
	v1.POST("/builds/create", controllers.CreateBuild)
	v1.POST("/builds/:id/upload", controllers.UploadPartial)
	v1.POST("/builds/:id/complete", controllers.UploadComplete)

	// Routes for GET method:
	v1.GET("/builds/:id", controllers.GetBuild)
}
