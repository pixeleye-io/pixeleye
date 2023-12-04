package middleware

import (
	"os"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/rs/zerolog"
)

func Logger() echo.MiddlewareFunc {
	logger := zerolog.New(os.Stdout)

	if os.Getenv("STAGE_STATUS") == "dev" {
		zerolog.SetGlobalLevel(zerolog.DebugLevel)
	}

	return middleware.RequestLoggerWithConfig(middleware.RequestLoggerConfig{
		LogURI:      true,
		LogStatus:   true,
		LogError:    true,
		LogRemoteIP: true,
		LogMethod:   true,
		LogLatency:  true,
		LogValuesFunc: func(c echo.Context, v middleware.RequestLoggerValues) error {
			if v.Error != nil {
				logger.Error().
					Err(v.Error).
					Str("URI", v.URI).
					Int("status", v.Status).
					Str("method", v.Method).
					Str("remote_ip", v.RemoteIP).
					Str("latency", v.Latency.String()).
					Msg("request")
			}
			logger.Info().
				Str("URI", v.URI).
				Int("status", v.Status).
				Str("method", v.Method).
				Str("remote_ip", v.RemoteIP).
				Str("latency", v.Latency.String()).
				Msg("request")

			return nil
		},
	})
}
