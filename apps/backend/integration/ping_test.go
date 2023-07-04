package integration

import (
	"io"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

func TestPingRoute(t *testing.T) {
	tests := []struct {
		description  string // description of the test case
		route        string // route path to test
		expectedCode int    // expected HTTP status code
		method       string // HTTP method
		body         string // HTTP body
	}{
		// First test case
		{
			description:  "get HTTP status 200 with pong message",
			route:        "/ping",
			expectedCode: 200,
			method:       "GET",
			body: MustJson(t, fiber.Map{
				"error":   false,
				"message": "pong",
			}),
		},
	}

	// Iterate through test single test cases
	for _, test := range tests {
		// Create a new http request with the route from the test case
		req := httptest.NewRequest(test.method, test.route, nil)

		// Perform the request plain with the app,
		// the second argument is a request latency
		// (set to -1 for no latency)
		resp, _ := app.Test(req, 1)

		// Read body
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			t.Fail()
		}

		resp.Body.Close()

		// Verify, if the status code is as expected
		assert.Equalf(t, test.expectedCode, resp.StatusCode, test.description)
		assert.Equalf(t, test.body, string(body), test.description)
	}
}
