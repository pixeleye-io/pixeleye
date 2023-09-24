package utils

import (
	"errors"
	"os"
	"strconv"
)

var ErrEnvVarEmpty = errors.New("getenv: environment variable empty")

// GetEnvStr retrieves the value of the specified environment variable.
// If the environment variable is not set or is empty, it returns an error.
func GetEnvStr(key string) (string, error) {
	v := os.Getenv(key)
	if v == "" {
		return v, ErrEnvVarEmpty
	}
	return v, nil
}

// GetEnvInt returns the integer value of the environment variable with the given key.
// If the environment variable is not set or cannot be converted to an integer, an error is returned.
func GetEnvInt(key string) (int, error) {
	s, err := GetEnvStr(key)
	if err != nil {
		return 0, err
	}
	v, err := strconv.Atoi(s)
	if err != nil {
		return 0, err
	}
	return v, nil
}

// GetEnvBool returns the boolean value of the environment variable with the given key.
// If the environment variable is not set or cannot be converted to a boolean, an error is returned.
func GetEnvBool(key string) (bool, error) {
	s, err := GetEnvStr(key)
	if err != nil {
		return false, err
	}
	v, err := strconv.ParseBool(s)
	if err != nil {
		return false, err
	}
	return v, nil
}
