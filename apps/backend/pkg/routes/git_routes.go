package routes

import (
	"os"

	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/app/controllers"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
)

func GitRoutes(e *echo.Echo) {

	authMiddleware := middleware.NewOryMiddleware()

	v1 := e.Group("/v1/git")

	v1.Use(authMiddleware.Session)

	if os.Getenv("GITHUB_APP_NAME") != "" {
		v1.POST("/github", controllers.GithubAppInstallation)
		v1.GET("/github/callback", controllers.GithubAccountCallback)
	}
}
