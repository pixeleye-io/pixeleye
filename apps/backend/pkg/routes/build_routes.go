package routes

import (
	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/app/controllers"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
)

func BuildRoutes(e *echo.Echo) {

	authMiddleware := middleware.NewOryMiddleware()
	common := e.Group("/v1/builds/:build_id")
	common.Use(authMiddleware.Session)

	baseRoutes := common.Group("")
	baseRoutes.Use(middleware.LoadBuild)
	baseRoleMiddleware := middleware.NewProjectPermissionsRequired([]string{"admin", "viewer", "reviewer"}, []string{"admin", "owner"})
	baseRoutes.Use(baseRoleMiddleware.ProjectRoleAccess)

	baseRoutes.GET("", controllers.GetBuild)
	baseRoutes.GET("/snapshots", controllers.GetBuildSnapshots)

	reviewRoleMiddleware := middleware.NewProjectPermissionsRequired([]string{"admin", "reviewer"}, []string{"admin", "owner"})
	reviewRoutes := common.Group("/review")
	reviewRoutes.Use(middleware.LoadBuild)
	reviewRoutes.Use(reviewRoleMiddleware.ProjectRoleAccess)

	reviewRoutes.POST("/approve", controllers.ApproveSnapshots)
	reviewRoutes.POST("/reject", controllers.RejectSnapshots)

	reviewRoutes.POST("/approve/all", controllers.ApproveAllSnapshots)
	reviewRoutes.POST("/reject/all", controllers.RejectAllSnapshots)
}
