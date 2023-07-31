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
	commonRoutes := e.Group("/v1/projects/:id")

	commonRoutes.Use(authMiddleware.Session)

	baseRoleMiddleware := middleware.NewProjectPermissionsRequired([]string{"admin", "viewer", "reviewer"}, []string{"admin", "owner"})
	commonRoutes.Use(baseRoleMiddleware.ProjectRoleAccess)

	commonRoutes.GET("", controllers.GetProject)

	// Admin routes.
	adminRoutes := e.Group("/v1/projects/:id")
	adminRoleMiddleware := middleware.NewProjectPermissionsRequired([]string{"admin"}, []string{"admin", "owner"})

	adminRoutes.Use(adminRoleMiddleware.ProjectRoleAccess)

	adminRoutes.POST("/new-token", controllers.RegenerateToken)
}
