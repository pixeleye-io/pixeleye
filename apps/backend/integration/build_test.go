package integration

import (
	"testing"

	"github.com/go-testfixtures/testfixtures/v3"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
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

	tests := []TestData{
		{
			description:  "get HTTP status 200 with build fetch",
			route:        "/api/v1/builds/db77a875-d15b-42ed-8581-35aaab0e2bb7",
			expectedCode: 200,
			method:       "GET",
			responseBody: MustJson(t, fiber.Map{
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
			responseBody: MustJson(t, fiber.Map{
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
			responseBody: MustJson(t, fiber.Map{
				"error":   true,
				"message": "invalid UUID length: 1",
				"data":    nil,
			}),
		},
	}

	RunSimpleTests(t, tests)

}

func TestCreateBuild(t *testing.T) {

	bodyWrapper := func(bodyDataObj ResponseShapeObject, bodyDataStr ResponseShapeString) (ResponseShapeObject, ResponseShapeString) {

		_, err := uuid.Parse(bodyDataObj.Data["id"].(string))
		if err != nil {
			t.Log(err)
			t.FailNow()
		}

		delete(bodyDataObj.Data, "id")

		delete(bodyDataObj.Data, "updated_at")
		delete(bodyDataObj.Data, "created_at")

		return bodyDataObj, bodyDataStr
	}

	tests := []TestData{
		{
			description:  "get HTTP status 201 with build creation",
			route:        "/api/v1/builds/create",
			expectedCode: 201,
			method:       "POST",
			contentType:  "application/json",
			requestBody: MustJson(t, fiber.Map{
				"sha":     "1234567",
				"branch":  "main",
				"message": "Initial commit",
				"author":  "John Doe",
				"title":   "Initial commit",
			}),
			responseBody: MustJson(t, fiber.Map{
				"error":   false,
				"message": "Build created successfully",
				"data": fiber.Map{
					"sha":     "1234567",
					"branch":  "main",
					"errors":  nil,
					"message": "Initial commit",
					"author":  "John Doe",
					"status":  "uploading",
					"title":   "Initial commit",
				},
			}),
			bodyMapper: bodyWrapper,
		},
		{
			description:  "get HTTP status 201 with build creation  with minimal data",
			route:        "/api/v1/builds/create",
			expectedCode: 201,
			method:       "POST",
			contentType:  "application/json",
			requestBody: MustJson(t, fiber.Map{
				"sha":    "1234567",
				"branch": "main",
			}),
			responseBody: MustJson(t, fiber.Map{
				"error":   false,
				"message": "Build created successfully",
				"data": fiber.Map{
					"sha":     "1234567",
					"branch":  "main",
					"errors":  nil,
					"status":  "uploading",
					"author":  "",
					"title":   "",
					"message": "",
				},
			}),
			bodyMapper: bodyWrapper,
		},
		{
			description:  "get HTTP status 201 with build creation",
			route:        "/api/v1/builds/create",
			expectedCode: 400,
			method:       "POST",
			contentType:  "application/json",
			requestBody:  MustJson(t, fiber.Map{}),
			responseBody: MustJson(t, fiber.Map{
				"error":   true,
				"message": "Invalid build data",
				"data": fiber.Map{
					"Branch": "Key: 'Build.Branch' Error:Field validation for 'Branch' failed on the 'required' tag",
					"Sha":    "Key: 'Build.Sha' Error:Field validation for 'Sha' failed on the 'required' tag",
				},
			}),
		},
		{
			description:  "status is always set to uploading",
			route:        "/api/v1/builds/create",
			expectedCode: 201,
			method:       "POST",
			contentType:  "application/json",
			requestBody: MustJson(t, fiber.Map{
				"sha":    "1234567",
				"branch": "main",
				"status": "failed",
			}),
			responseBody: MustJson(t, fiber.Map{
				"error":   false,
				"message": "Build created successfully",
				"data": fiber.Map{
					"sha":     "1234567",
					"branch":  "main",
					"errors":  nil,
					"status":  "uploading",
					"author":  "",
					"title":   "",
					"message": "",
				},
			}),
			bodyMapper: bodyWrapper,
		},
	}

	RunSimpleTests(t, tests)

}
