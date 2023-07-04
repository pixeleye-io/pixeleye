package integration

import (
	"encoding/json"
	"io"
	"testing"
)

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

func SortBody(t *testing.T, r io.Reader) (string, error) {
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
		bodyStr = MustJson(t, bodyDataStr)
	} else {
		bodyStr = MustJson(t, bodDataObj)
	}

	return bodyStr, nil
}
