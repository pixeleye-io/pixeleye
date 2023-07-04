package integration

import (
	"testing"

	"github.com/gofiber/fiber/v2"
)

func TestPingRoute(t *testing.T) {
	tests := []TestData{
		{
			description:  "get HTTP status 200 with pong message",
			route:        "/ping",
			expectedCode: 200,
			method:       "GET",
			responseBody: MustJson(t, fiber.Map{
				"error":   false,
				"message": "pong",
				"data":    nil,
			}),
		},
	}

	RunSimpleTests(t, tests)
}
