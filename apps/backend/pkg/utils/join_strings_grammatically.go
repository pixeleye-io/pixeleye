package utils

func JoinStringsGrammatically(strings []string) string {
	var result string

	if len(strings) <= 1 {
		return result
	}

	for i, str := range strings {
		if i == len(strings)-1 {
			result += "and " + str
		} else {
			result += str + ", "
		}
	}

	return result
}
