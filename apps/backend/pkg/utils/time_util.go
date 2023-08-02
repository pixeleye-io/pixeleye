package utils

import (
	"time"
)

func CurrentTime() time.Time {
	return time.Now().Round(time.Millisecond).UTC()
}
