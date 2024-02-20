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
	baseV1 := v1.Group("")

	baseV1.Use(middleware.ProjectTokenMiddleware)
	buildIDV1.Use(middleware.LoadBuild)
	buildIDV1.Use(middleware.ProjectTokenMiddleware)

	baseV1.POST("/builds/create", controllers.CreateBuild)
	buildIDV1.POST("/upload", controllers.UploadPartial)
	buildIDV1.POST("/complete", controllers.UploadComplete)
	buildIDV1.POST("/abort", controllers.AbortBuild)
	buildIDV1.GET("/events", controllers.SubscribeToBuild)
	baseV1.POST("/snapshots/upload", controllers.CreateUploadURL)
	baseV1.POST("/builds", controllers.SearchBuilds)
	baseV1.POST("/latestBuilds", controllers.GetLatestBuildsFromShas)

	buildIDV1.GET("", controllers.GetBuild)
	baseV1.GET("/snapshots/:hash", controllers.GetSnapURL) //TODO move this out of project token routes
}
