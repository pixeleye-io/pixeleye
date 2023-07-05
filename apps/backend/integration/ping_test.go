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
			responseBody: mustJson(t, fiber.Map{
				"message": "pong",
				"data":    nil,
			}),
		},
	}

	runSimpleTests(t, tests)
}
