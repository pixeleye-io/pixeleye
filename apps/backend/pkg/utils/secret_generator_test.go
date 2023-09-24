package utils

import (
	"testing"
)

func TestGenerateRandomBytes(t *testing.T) {
	// Test generating 16 random bytes
	b, err := GenerateRandomBytes(16)
	if err != nil {
		t.Errorf("Error generating random bytes: %v", err)
	}

	if len(b) != 16 {
		t.Errorf("Expected 16 bytes, but got %d", len(b))
	}
}

func TestGenerateRandomStringURLSafe(t *testing.T) {
	// Test generating a random string of length 32
	s, err := GenerateRandomStringURLSafe(32)
	if err != nil {
		t.Errorf("Error generating random string: %v", err)
	}

	if len(s) != 44 { // 32 bytes encoded in URL-safe base64 is 44 characters long
		t.Errorf("Expected 44 characters, but got %d", len(s))
	}
}