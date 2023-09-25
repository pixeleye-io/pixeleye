package imageDiff

import (
	"image/color"
	"testing"
)

func TestDelta(t *testing.T) {
	black := color.RGBA{0, 0, 0, 255}
	white := color.RGBA{255, 255, 255, 255}
	red := color.RGBA{255, 0, 0, 255}
	green := color.RGBA{0, 255, 0, 255}
	blue := color.RGBA{0, 0, 255, 255}

	tests := []struct {
		name     string
		pixelA   color.Color
		pixelB   color.Color
		expected float64
	}{
		{"black and white", black, white, 32857.13315714265},
		{"white and black", white, black, 32857.13315714265},
		{"red and green", red, green, 24298.8755187344},
		{"green and blue", green, blue, 16214.709176414715},
		{"blue and red", blue, red, 17620.62777490937},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := Delta(tt.pixelA, tt.pixelB); got != tt.expected {
				t.Errorf("Delta() = %v, want %v", got, tt.expected)
			}
		})
	}
}
