package routes

import (
	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/app/controllers"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
)

// These routes are protected by an api key. They're used by the pixeleye cli to upload builds.
func BuildRoutes(e *echo.Echo) {

	tokenMiddleware := middleware.NewProjectMiddleware()

	v1 := e.Group("/v1")

	v1.Use(tokenMiddleware.ProjectToken)

	v1.POST("/builds/create", controllers.CreateBuild)
	v1.POST("/builds/:id/upload", controllers.UploadPartial)
	v1.POST("/builds/:id/complete", controllers.UploadComplete)

	v1.GET("/builds/:id", controllers.GetBuild)
}
