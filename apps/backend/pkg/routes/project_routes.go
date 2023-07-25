package routes

import (
	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/app/controllers"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
)

// These routes are protected by an api key. They're used by the pixeleye cli to upload builds.
func ProjectRoutes(e *echo.Echo) {

	authMiddleware := middleware.NewOryMiddleware()

	// Create routes group.
	v1 := e.Group("/v1")

	v1.Use(authMiddleware.Session)

	v1.POST("/projects", controllers.CreateProject)
	v1.POST("/projects/:id/new-token", controllers.RegenerateToken)


	v1.GET("/projects/:id", controllers.GetProject)
	v1.GET("/projects", controllers.GetTeamsProjects)

}
