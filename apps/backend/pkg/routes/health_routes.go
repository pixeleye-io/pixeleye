package routes

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/app/controllers"
)

// Ping func for pinging server.
func HealthRoutes(e *echo.Echo) {

	v1 := e.Group("/v1")

	v1.GET("/ping", func(c echo.Context) error {
		// Return HTTP 200 status and JSON response.
		return c.String(http.StatusOK, "pong")
	})

	v1.GET("/event", controllers.EventTest)

}
