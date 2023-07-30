package middleware

import (
	"net/http"
	"os"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func AdminAPI() echo.MiddlewareFunc {
	adminKey := strings.ReplaceAll(os.Getenv("ADMIN_API_KEY"), " ", "")
	if len(adminKey) < 31 {
		// If an improper key is set, we always want to deny access.
		return func(next echo.HandlerFunc) echo.HandlerFunc {
			return func(c echo.Context) error {
				return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
			}
		}
	}

	return middleware.KeyAuth(func(key string, c echo.Context) (bool, error) {
		return key == adminKey, nil
	})
}
