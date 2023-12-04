package routes

import (
	"os"

	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/app/controllers"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
)

// These routes are protected by an api key. They're used by the pixeleye cli to upload builds.
func TeamRoutes(e *echo.Echo) {

	authMiddleware := middleware.NewOryMiddleware()

	v1 := e.Group("/v1/teams/:team_id")

	v1.Use(authMiddleware.Session)

	baseRoutes := v1.Group("")

	baseRoleMiddleware := middleware.NewPermissionsRequired([]string{"owner", "admin", "member", "accountant"})
	baseRoutes.Use(baseRoleMiddleware.TeamRoleAccess)

	baseRoutes.POST("/projects", controllers.CreateProject)

	baseRoutes.GET("/projects", controllers.GetTeamProjects)
	baseRoutes.GET("/users", controllers.GetTeamUsers)

	baseRoutes.GET("/repos", controllers.GetRepos)

	baseRoutes.GET("/installations", controllers.GetInstallations)

	baseRoutes.GET("/usage/snapshots", controllers.GetTeamSnapshotUsage)
	baseRoutes.GET("/usage/builds", controllers.GetTeamBuildUsage)

	if os.Getenv("PIXELEYE_HOSTING") == "true" {
		billingRoutes := v1.Group("/billing")

		billingRoleMiddleware := middleware.NewPermissionsRequired([]string{"owner", "admin", "accountant"})
		billingRoutes.Use(billingRoleMiddleware.TeamRoleAccess)

		billingRoutes.GET("/portal", controllers.GetBillingPortalSession)
		billingRoutes.POST("/account", controllers.CreateBillingAccount)
		billingRoutes.POST("/plan", controllers.SubscribeToPlan)
		billingRoutes.GET("/plan", controllers.GetTeamBillingPlan)

	}

	adminRoutes := v1.Group("/admin")

	adminRoleMiddleware := middleware.NewPermissionsRequired([]string{"owner", "admin"})
	adminRoutes.Use(adminRoleMiddleware.TeamRoleAccess)

	adminRoutes.PATCH("", controllers.UpdateTeam)

	adminRoutes.DELETE("/users/:user_id", controllers.RemoveTeamMember)

}
