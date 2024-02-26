package routes

import (
	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/app/controllers"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
)

// These routes are protected by an api key. They're used by the pixeleye cli to upload builds.
func UserRoutes(e *echo.Echo) {

	oryMiddleware := middleware.NewOryMiddleware()

	// Create routes group.
	v1 := e.Group("/v1")

	v1.Use(oryMiddleware.Session)

	v1.GET("/user/me", controllers.GetAuthenticatedUser)

	v1.GET("/user/teams", controllers.GetUserTeams)

	v1.POST("/user/teams/sync", controllers.SyncUserTeams)

	v1.PATCH("/user/me", controllers.UpdateUser)

	v1.POST("/user/refer", controllers.ReferUser)

}
