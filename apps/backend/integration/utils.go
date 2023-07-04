package integration

import (
	"encoding/json"
	"io"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

type BodyMapper func(bodyDataStr ResponseShapeObject, bodDataObj ResponseShapeString) (ResponseShapeObject, ResponseShapeString)

type TestData struct {
	description  string // description of the test case
	route        string // route path to test
	expectedCode int    // expected HTTP status code
	method       string // HTTP method
	requestBody  string // HTTP body
	responseBody string // HTTP body
	contentType  string // HTTP content type
	bodyMapper   BodyMapper
}

type ResponseShapeString struct {
	Data    string `json:"data"` // Rest of the fields should go here.
	Error   bool   `json:"error"`
	Message string `json:"message"`
}

type ResponseShapeObject struct {
	Data    map[string]interface{} `json:"data"` // Rest of the fields should go here.
	Error   bool                   `json:"error"`
	Message string                 `json:"message"`
}

func MustJson(t *testing.T, v interface{}) string {
	t.Helper()
	out, err := json.Marshal(v)
	if err != nil {
		t.Fatal(err)
	}
	return string(out)
}

func SortBody(t *testing.T, r io.Reader, bodyMapper BodyMapper) (string, error) {
	var bodyStr string

	// Read body
	body, err := io.ReadAll(r)
	if err != nil {
		return "", err
	}

	bodDataObj := ResponseShapeObject{}
	bodyDataStr := ResponseShapeString{}

	if err := json.Unmarshal(body, &bodDataObj); err != nil {
		if err := json.Unmarshal(body, &bodyDataStr); err != nil {
			return "", err
		}

		if bodyMapper != nil {
			_, bodyDataStr = bodyMapper(bodDataObj, bodyDataStr)
		}
		bodyStr = MustJson(t, bodyDataStr)
	} else {
		if bodyMapper != nil {
			bodDataObj, _ = bodyMapper(bodDataObj, bodyDataStr)
		}
		bodyStr = MustJson(t, bodDataObj)
	}

	return bodyStr, nil
}

func RunSimpleTests(t *testing.T, tests []TestData) {
	// Iterate through test single test cases
	for _, test := range tests {

		var bodyReader io.Reader

		if test.requestBody != "" {
			bodyReader = strings.NewReader(test.requestBody)
		}

		// Create a new http request with the route from the test case
		req := httptest.NewRequest(test.method, test.route, bodyReader)

		// Set the content type if provided
		if test.contentType != "" {
			req.Header.Set("Content-Type", test.contentType)
		}

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
		body, err := SortBody(t, resp.Body, test.bodyMapper)

		if err != nil {
			t.Log(err.Error())
			t.Fail()
			continue
		}

		resp.Body.Close()

		// Verify, if the status code is as expected
		assert.Equalf(t, test.expectedCode, resp.StatusCode, test.description)
		assert.Equalf(t, test.responseBody, body, test.description)
	}
}
