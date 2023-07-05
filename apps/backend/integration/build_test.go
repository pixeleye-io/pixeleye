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
			responseBody: mustJson(t, fiber.Map{
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
			responseBody: mustJson(t, fiber.Map{
				"message": "Build with given ID not found",
				"data":    nil,
			}),
		},
		{
			description:  "get HTTP status 400 with incorrect UUID length",
			route:        "/api/v1/builds/1",
			expectedCode: 400,
			method:       "GET",
			responseBody: mustJson(t, fiber.Map{
				"message": "invalid UUID length: 1",
				"data":    nil,
			}),
		},
	}

	runSimpleTests(t, tests)

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
			requestBody: mustJson(t, fiber.Map{
				"sha":     "1234567",
				"branch":  "main",
				"message": "Initial commit",
				"author":  "John Doe",
				"title":   "Initial commit",
			}),
			responseBody: mustJson(t, fiber.Map{
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
			requestBody: mustJson(t, fiber.Map{
				"sha":    "1234567",
				"branch": "main",
			}),
			responseBody: mustJson(t, fiber.Map{
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
			requestBody:  mustJson(t, fiber.Map{}),
			responseBody: mustJson(t, fiber.Map{
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
			requestBody: mustJson(t, fiber.Map{
				"sha":    "1234567",
				"branch": "main",
				"status": "failed",
			}),
			responseBody: mustJson(t, fiber.Map{
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

	runSimpleTests(t, tests)

}

func TestBuildComplete(t *testing.T) {

	fixtures, err := testfixtures.New(
		testfixtures.Database(db.DB),
		testfixtures.Dialect("postgres"),
		testfixtures.Files("fixtures/build.yml", "fixtures/snapshot.yml"),
	)

	if err != nil {
		t.Fatal(err)
	}

	if err := fixtures.Load(); err != nil {
		t.Fatal(err)
	}

	BodyMapper := func(bodyDataObj ResponseShapeObject, bodyDataStr ResponseShapeString) (ResponseShapeObject, ResponseShapeString) {
		delete(bodyDataObj.Data, "updated_at")
		return bodyDataObj, bodyDataStr
	}

	tests := []TestData{
		{
			description:  "get HTTP status 200 with build completion",
			route:        "/api/v1/builds/db77a875-d15b-42ed-8581-35aaab0e2bb7/complete",
			expectedCode: 202,
			method:       "POST",
			responseBody: mustJson(t, fiber.Map{
				"message": "build marked as complete",
				"data": fiber.Map{
					"id":         "db77a875-d15b-42ed-8581-35aaab0e2bb7",
					"created_at": "2020-12-31T23:59:59Z",
					"updated_at": "2020-12-31T23:59:59Z",
					"sha":        "1234567",
					"branch":     "main",
					"message":    "Initial commit",
					"author":     "John Doe",
					"title":      "Initial commit",
					"status":     "unchanged",
					"errors":     []string{},
				},
			}),
		},
		{
			description:  "We acknowledge the build has already been completed",
			route:        "/api/v1/builds/db77a875-d15b-42ed-8581-35aaab0e2bb7/complete",
			expectedCode: 202,
			method:       "POST",
			responseBody: mustJson(t, fiber.Map{
				"message": "build has already been marked as complete",
				"data": fiber.Map{
					"id":         "db77a875-d15b-42ed-8581-35aaab0e2bb7",
					"created_at": "2020-12-31T23:59:59Z",
					"sha":        "1234567",
					"branch":     "main",
					"message":    "Initial commit",
					"author":     "John Doe",
					"title":      "Initial commit",
					"status":     "unchanged",
					"errors":     []string{},
				},
			}),
			bodyMapper: BodyMapper,
		},
		{
			description:  "get HTTP status 404 with build completion",
			route:        "/api/v1/builds/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/complete",
			expectedCode: 404,
			method:       "POST",
			responseBody: mustJson(t, fiber.Map{
				"message": "build with given ID not found",
				"data":    nil,
			}),
		},
		{
			description:  "get HTTP status 400 with build completion",
			route:        "/api/v1/builds/aaaaaaaa/complete",
			expectedCode: 400,
			method:       "POST",
			responseBody: mustJson(t, fiber.Map{
				"message": "invalid build ID",
				"data":    nil,
			}),
		},
		{
			description:  "get HTTP status 200 with build status processing as a snapshot is still being processed",
			route:        "/api/v1/builds/db77a875-d15b-42ed-8581-35aaab0e2bb9/complete",
			expectedCode: 202,
			method:       "POST",
			responseBody: mustJson(t, fiber.Map{
				"message": "build marked as complete",
				"data": fiber.Map{
					"id":         "db77a875-d15b-42ed-8581-35aaab0e2bb9",
					"created_at": "2020-12-31T23:59:59Z",
					"sha":        "1234567",
					"branch":     "main",
					"message":    "Initial commit",
					"author":     "John Doe",
					"title":      "Initial commit",
					"status":     "processing",
					"errors":     []string{},
				},
			}),
			bodyMapper: BodyMapper,
		},
		{
			description:  "get HTTP status 200 with build status unchanged as only snapshot is unchanged",
			route:        "/api/v1/builds/db77a875-d15b-42ed-8581-35a3ab0e2bb9/complete",
			expectedCode: 202,
			method:       "POST",
			responseBody: mustJson(t, fiber.Map{
				"message": "build marked as complete",
				"data": fiber.Map{
					"id":         "db77a875-d15b-42ed-8581-35a3ab0e2bb9",
					"created_at": "2020-12-31T23:59:59Z",
					"sha":        "1234567",
					"branch":     "main",
					"message":    "Initial commit",
					"author":     "John Doe",
					"title":      "Initial commit",
					"status":     "unchanged",
					"errors":     []string{},
				},
			}),
			bodyMapper: BodyMapper,
		},
		{
			description:  "get HTTP status 200 with build status unreviewed as only snapshot is unreviewed",
			route:        "/api/v1/builds/db77a875-d15b-42dd-8581-35a3ab0e2bb9/complete",
			expectedCode: 202,
			method:       "POST",
			responseBody: mustJson(t, fiber.Map{
				"message": "build marked as complete",
				"data": fiber.Map{
					"id":         "db77a875-d15b-42dd-8581-35a3ab0e2bb9",
					"created_at": "2020-12-31T23:59:59Z",
					"sha":        "1234567",
					"branch":     "main",
					"message":    "Initial commit",
					"author":     "John Doe",
					"title":      "Initial commit",
					"status":     "unreviewed",
					"errors":     []string{},
				},
			}),
			bodyMapper: BodyMapper,
		},
		{
			description:  "get HTTP status 200 with build status failed as a snapshot has failed",
			route:        "/api/v1/builds/db77a875-d15b-42dd-8581-35a3cd0e2bb9/complete",
			expectedCode: 202,
			method:       "POST",
			responseBody: mustJson(t, fiber.Map{
				"message": "build marked as complete",
				"data": fiber.Map{
					"id":         "db77a875-d15b-42dd-8581-35a3cd0e2bb9",
					"created_at": "2020-12-31T23:59:59Z",
					"sha":        "1234567",
					"branch":     "main",
					"message":    "Initial commit",
					"author":     "John Doe",
					"title":      "Initial commit",
					"status":     "failed",
					"errors":     []string{},
				},
			}),
			bodyMapper: BodyMapper,
		},
	}

	runSimpleTests(t, tests)
}
