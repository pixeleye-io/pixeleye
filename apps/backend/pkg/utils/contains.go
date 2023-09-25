package utils

// ContainsString checks if a string is present in a slice of strings.
func ContainsString(s []string, str string) bool {
	for _, v := range s {
		if v == str {
			return true
		}
	}

	return false
}
