package integration

import (
	"testing"

	"github.com/gofiber/fiber/v2"
)

func Test404Route(t *testing.T) {
	tests := []TestData{
		{
			description:  "get HTTP status  404",
			route:        "/not-found",
			expectedCode: 404,
			method:       "GET",
			responseBody: MustJson(t, fiber.Map{
				"error":   true,
				"message": "sorry, endpoint is not found",
				"data":    nil,
			}),
		},
	}

	RunSimpleTests(t, tests)
}
