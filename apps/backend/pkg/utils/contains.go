package utils

import "database/sql"

func ContainsString(s []string, str string) bool {
	for _, v := range s {
		if v == str {
			return true
		}
	}

	return false
}

func ContainsNullString(s []sql.NullString, str sql.NullString) bool {
	for _, v := range s {
		if v.String == str.String {
			return true
		}
	}

	return false
}
