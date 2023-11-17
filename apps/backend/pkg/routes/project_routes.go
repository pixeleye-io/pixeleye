package routes

import (
	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/app/controllers"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
)

// These routes are protected by an api key. They're used by the pixeleye cli to upload builds.
func ProjectRoutes(e *echo.Echo) {

	authMiddleware := middleware.NewOryMiddleware()

	common := e.Group("/v1/projects")

	common.Use(authMiddleware.Session)

	baseRoutes := common.Group("/:project_id")

	baseRoleMiddleware := middleware.NewProjectPermissionsRequired([]string{"admin", "viewer", "reviewer"}, []string{"admin", "owner"})
	baseRoutes.Use(baseRoleMiddleware.ProjectRoleAccess)

	baseRoutes.GET("", controllers.GetProject)
	baseRoutes.GET("/builds", controllers.GetProjectBuilds)
	baseRoutes.GET("/users", controllers.GetProjectUsers)

	baseRoutes.Any("/events", controllers.SubscribeToProject)

	// Admin routes.
	adminRoutes := common.Group("/:project_id/admin")

	adminRoleMiddleware := middleware.NewProjectPermissionsRequired([]string{"admin"}, []string{"admin", "owner"})

	adminRoutes.Use(adminRoleMiddleware.ProjectRoleAccess)

	adminRoutes.DELETE("", controllers.DeleteProject)
	adminRoutes.PATCH("", controllers.UpdateProject)
	adminRoutes.POST("/new-token", controllers.RegenerateToken)
	adminRoutes.DELETE("/users/:user_id", controllers.RemoveUserFromProject)
	adminRoutes.PATCH("/users/:user_id", controllers.UpdateUserOnProject)
	adminRoutes.POST("/users", controllers.AddUserToProject)
}
