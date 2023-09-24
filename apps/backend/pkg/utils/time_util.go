package utils

import (
	"time"
)

// CurrentTime returns the current time in UTC rounded to the nearest millisecond.
func CurrentTime() time.Time {
	return time.Now().Round(time.Millisecond).UTC()
}
