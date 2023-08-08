package routes

import (
	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/app/controllers"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
)

// These routes are protected by an api key. They're used by the pixeleye cli to upload builds.
func ProjectTokenRoutes(e *echo.Echo) {

	tokenMiddleware := middleware.NewProjectMiddleware()

	v1 := e.Group("/v1/client")

	v1.Use(tokenMiddleware.ProjectToken)

	v1.POST("/builds/create", controllers.CreateBuild)
	v1.POST("/builds/:id/upload", controllers.UploadPartial)
	v1.POST("/builds/:id/complete", controllers.UploadComplete)
	v1.POST("/snapshots/upload/:hash", controllers.GetUploadURL)
	v1.POST("/builds", controllers.SearchBuilds)

	v1.GET("/builds/:id", controllers.GetBuild)
	v1.GET("/snapshots/:hash", controllers.GetSnapURL) //TODO move this out of project token routes
}
