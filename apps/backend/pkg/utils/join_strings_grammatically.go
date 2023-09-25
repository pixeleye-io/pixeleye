package utils

// JoinStringsGrammatically joins a slice of strings together in a grammatically correct way.
// It returns a string with the joined strings, separated by commas and the word "and" before the last string.
// If the input slice has less than or equal to one element, it returns an empty string.
func JoinStringsGrammatically(strings []string) string {
	var result string

	if len(strings) <= 1 {
		return result
	}

	for i, str := range strings {
		if i == len(strings)-1 {
			result += "and " + str
		} else if len(strings) == 2 {
			result += str + " "
		} else {
			result += str + ", "
		}
	}

	return result
}
