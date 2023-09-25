package utils

import (
	"crypto/rand"
	"encoding/base64"
)

// GenerateRandomBytes returns a slice of n random bytes generated using the crypto/rand package.
func GenerateRandomBytes(n int) ([]byte, error) {
	b := make([]byte, n)
	n, err := rand.Read(b)

	if err != nil || n != len(b) {
		return nil, err
	}

	return b, nil
}

// GenerateRandomStringURLSafe generates a random string of length n using URL-safe base64 encoding.
// It returns the generated string and any error encountered during the process.
func GenerateRandomStringURLSafe(n int) (string, error) {
	b, err := GenerateRandomBytes(n)
	return base64.URLEncoding.EncodeToString(b), err
}
