package utils

import (
	"encoding/base64"

	"github.com/google/uuid"
)

func ShortenUUID(id uuid.UUID) string {

	return base64.RawURLEncoding.EncodeToString([]byte(id.String()))
}

func ExpandUUID(id string) (uuid.UUID, error) {

	decoded, err := base64.RawURLEncoding.DecodeString(id)
	if err != nil {
		return uuid.UUID{}, err
	}

	return uuid.ParseBytes(decoded)
}
