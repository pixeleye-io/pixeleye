package routes

import (
	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/app/controllers"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
)

// These routes are protected by an api key. They're used by the pixeleye cli to upload builds.
func TeamRoutes(e *echo.Echo) {

	authMiddleware := middleware.NewOryMiddleware()

	v1 := e.Group("/v1/teams/:team_id")

	v1.Use(authMiddleware.Session)

	baseRoleMiddleware := middleware.NewPermissionsRequired([]string{"owner", "admin", "member", "accountant"})
	v1.Use(baseRoleMiddleware.TeamRoleAccess)

	v1.POST("/projects", controllers.CreateProject)

	v1.GET("/projects", controllers.GetTeamsProjects)

	v1.GET("/repos", controllers.GetRepos)
}
