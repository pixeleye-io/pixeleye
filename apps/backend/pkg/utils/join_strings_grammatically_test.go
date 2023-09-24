package utils

import "testing"

func TestJoinStringsGrammatically(t *testing.T) {
	testCases := []struct {
		name     string
		strings  []string
		expected string
	}{
		{
			name:     "empty slice",
			strings:  []string{},
			expected: "",
		},
		{
			name:     "single string",
			strings:  []string{"apple"},
			expected: "",
		},
		{
			name:     "two strings",
			strings:  []string{"apple", "banana"},
			expected: "apple and banana",
		},
		{
			name:     "three strings",
			strings:  []string{"apple", "banana", "cherry"},
			expected: "apple, banana, and cherry",
		},
		{
			name:     "four strings",
			strings:  []string{"apple", "banana", "cherry", "date"},
			expected: "apple, banana, cherry, and date",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := JoinStringsGrammatically(tc.strings)
			if result != tc.expected {
				t.Errorf("expected %q but got %q", tc.expected, result)
			}
		})
	}
}
