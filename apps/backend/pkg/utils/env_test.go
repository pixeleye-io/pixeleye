package utils

import (
	"os"
	"testing"
)

func TestGetEnvStr(t *testing.T) {
	key := "TEST_KEY"
	value := "test_value"
	os.Setenv(key, value)

	result, err := GetEnvStr(key)
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}
	if result != value {
		t.Errorf("expected %s, but got %s", value, result)
	}

	os.Unsetenv(key)

	_, err = GetEnvStr(key)
	if err == nil {
		t.Errorf("expected error, but got nil")
	}
	if err != ErrEnvVarEmpty {
		t.Errorf("expected %v, but got %v", ErrEnvVarEmpty, err)
	}
}

func TestGetEnvInt(t *testing.T) {
	key := "TEST_KEY"
	value := "123"
	os.Setenv(key, value)

	result, err := GetEnvInt(key)
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}
	if result != 123 {
		t.Errorf("expected 123, but got %d", result)
	}

	os.Setenv(key, "not_an_int")

	_, err = GetEnvInt(key)
	if err == nil {
		t.Errorf("expected error, but got nil")
	}
}

func TestGetEnvBool(t *testing.T) {
	key := "TEST_KEY"
	value := "true"
	os.Setenv(key, value)

	result, err := GetEnvBool(key)
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}
	if result != true {
		t.Errorf("expected true, but got %t", result)
	}

	os.Setenv(key, "not_a_bool")

	_, err = GetEnvBool(key)
	if err == nil {
		t.Errorf("expected error, but got nil")
	}
}
