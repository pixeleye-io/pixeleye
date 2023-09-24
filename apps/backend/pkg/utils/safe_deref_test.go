package utils

import "testing"

func TestSafeDeref(t *testing.T) {
	type testStruct struct {
		Name string
	}

	var nilPointer *testStruct
	var nonNilPointer = &testStruct{Name: "test"}

	// Test with nil pointer
	result := SafeDeref(nilPointer)
	if result != (testStruct{}) {
		t.Errorf("Expected zero value of type testStruct, but got %v", result)
	}

	// Test with non-nil pointer
	result = SafeDeref(nonNilPointer)
	if result != *nonNilPointer {
		t.Errorf("Expected %v, but got %v", *nonNilPointer, result)
	}
}