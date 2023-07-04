package integration

import (
	"net/http/httptest"
	"testing"

	"github.com/go-testfixtures/testfixtures/v3"
	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

func TestGetBuild(t *testing.T) {

	fixtures, err := testfixtures.New(
		testfixtures.Database(db.DB),
		testfixtures.Dialect("postgres"),
		testfixtures.Files("fixtures/build.yml"),
	)

	if err != nil {
		t.Fatal(err)
	}

	if err := fixtures.Load(); err != nil {
		t.Fatal(err)
	}

	tests := []struct {
		description  string // description of the test case
		route        string // route path to test
		expectedCode int    // expected HTTP status code
		method       string // HTTP method
		body         string // HTTP body
	}{
		{
			description:  "get HTTP status 200 with build fetch",
			route:        "/api/v1/builds/db77a875-d15b-42ed-8581-35aaab0e2bb7",
			expectedCode: 200,
			method:       "GET",
			body: MustJson(t, fiber.Map{
				"error":   false,
				"message": "Build retrieved successfully",
				"data": fiber.Map{
					"id":         "db77a875-d15b-42ed-8581-35aaab0e2bb7",
					"created_at": "2020-12-31T23:59:59Z",
					"updated_at": "2020-12-31T23:59:59Z",
					"sha":        "1234567",
					"branch":     "main",
					"message":    "Initial commit",
					"author":     "John Doe",
					"title":      "Initial commit",
					"status":     "uploading",
					"errors":     []string{},
				},
			}),
		},
		{
			description:  "get HTTP status 404 with build fetch",
			route:        "/api/v1/builds/db77a875-d15b-42ed-8581-353aab0e2bb7",
			expectedCode: 404,
			method:       "GET",
			body: MustJson(t, fiber.Map{
				"error":   true,
				"message": "Build with given ID not found",
				"data":    nil,
			}),
		},
		{
			description:  "get HTTP status 400 with incorrect UUID length",
			route:        "/api/v1/builds/1",
			expectedCode: 400,
			method:       "GET",
			body: MustJson(t, fiber.Map{
				"error":   true,
				"message": "invalid UUID length: 1",
				"data":    nil,
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
		resp, err := app.Test(req)

		if err != nil {
			t.Log(err.Error())
			t.Fail()
			continue
		}

		// Read body
		body, err := SortBody(t, resp.Body)

		if err != nil {
			t.Log(err.Error())
			t.Fail()
			continue
		}

		resp.Body.Close()

		// Verify, if the status code is as expected
		assert.Equalf(t, test.expectedCode, resp.StatusCode, test.description)
		assert.Equalf(t, test.body, body, test.description)
	}

}
