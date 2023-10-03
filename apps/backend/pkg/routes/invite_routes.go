package routes

import (
	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/app/controllers"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
)

// These routes are protected by an api key. They're used by the pixeleye cli to upload builds.
func InviteRoutes(e *echo.Echo) {

	authMiddleware := middleware.NewOryMiddleware()

	common := e.Group("/v1/invites/:invite_code")

	common.Use(authMiddleware.Session)

	common.POST("/accept", controllers.AcceptProjectInvite)
	common.GET("", controllers.GetProjectInvite)
}
