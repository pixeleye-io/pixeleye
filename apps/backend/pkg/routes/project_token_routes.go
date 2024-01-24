package routes

import (
	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/app/controllers"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
)

// These routes are protected by an api key. They're used by the pixeleye cli to upload builds.
func ProjectTokenRoutes(e *echo.Echo) {

	v1 := e.Group("/v1/client")
	buildIDV1 := v1.Group("/builds/:build_id")

	v1.Use(middleware.ProjectTokenMiddleware)
	buildIDV1.Use(middleware.LoadBuild)
	buildIDV1.Use(middleware.ProjectTokenMiddleware)

	v1.POST("/builds/create", controllers.CreateBuild)
	buildIDV1.POST("/upload", controllers.UploadPartial)
	buildIDV1.POST("/complete", controllers.UploadComplete)
	buildIDV1.POST("/abort", controllers.AbortBuild)
	buildIDV1.GET("/events", controllers.SubscribeToBuild)
	v1.POST("/snapshots/upload", controllers.CreateUploadURL)
	v1.POST("/builds", controllers.SearchBuilds)
	v1.POST("/latestBuilds", controllers.GetLatestBuildsFromShas)

	buildIDV1.GET("", controllers.GetBuild)
	v1.GET("/snapshots/:hash", controllers.GetSnapURL) //TODO move this out of project token routes
}
