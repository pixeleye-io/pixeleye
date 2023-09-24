package utils

import "testing"

func TestContainsString(t *testing.T) {
	s := []string{"apple", "banana", "orange"}
	str := "banana"
	if !ContainsString(s, str) {
		t.Errorf("ContainsString(%v, %s) = false, expected true", s, str)
	}

	s = []string{"apple", "banana", "orange"}
	str = "pear"
	if ContainsString(s, str) {
		t.Errorf("ContainsString(%v, %s) = true, expected false", s, str)
	}
}
