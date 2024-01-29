package routes

import (
	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/app/controllers"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
)

func SnapshotRoutes(e *echo.Echo) {

	authMiddleware := middleware.NewOryMiddleware()
	common := e.Group("/v1/snapshots/:snap_id")
	common.Use(authMiddleware.Session)

	baseRoutes := common.Group("")
	baseRoutes.Use(middleware.LoadSnapshot)
	baseRoutes.Use(middleware.LoadBuild)
	baseRoleMiddleware := middleware.NewProjectPermissionsRequired([]string{"admin", "viewer", "reviewer"}, []string{"admin", "owner"})
	baseRoutes.Use(baseRoleMiddleware.ProjectRoleAccess)

	baseRoutes.POST("/conversations", controllers.CreateSnapshotConversation)
	baseRoutes.GET("/conversations", controllers.GetConversationsWithMessages)
}
