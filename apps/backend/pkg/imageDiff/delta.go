package imageDiff

import (
	"image/color"
)

func normalize(rgba color.Color) (uint8, uint8, uint8, uint8) {
	r, g, b, a := rgba.RGBA()

	return uint8(r), uint8(g), uint8(b), uint8(a)
}

func rgb2y(r, g, b uint8) float64 {
	return float64(r)*0.29889531 + float64(g)*0.58662247 + float64(b)*0.11448223
}

func rgb2i(r, g, b uint8) float64 {
	return float64(r)*0.59597799 - float64(g)*0.27417610 - float64(b)*0.32180189
}

func rgb2q(r, g, b uint8) float64 {
	return float64(r)*0.21147017 - float64(g)*0.52261711 + float64(b)*0.31114694
}

// Delta between two pixels.
func Delta(pixelA color.Color, pixelB color.Color) float64 {
	r1, g1, b1, _ := normalize(pixelA)
	r2, g2, b2, _ := normalize(pixelB)

	y := rgb2y(r1, g1, b1) - rgb2y(r2, g2, b2)
	i := rgb2i(r1, g1, b1) - rgb2i(r2, g2, b2)
	q := rgb2q(r1, g1, b1) - rgb2q(r2, g2, b2)

	return 0.5053*y*y + 0.299*i*i + 0.1957*q*q
}

func blend(c uint8, a uint8) uint8 {
	return 255 + (c-255)*a
}

func blendSemiTransparentColor(r, g, b, a uint8) (uint8, uint8, uint8, uint8) {

	if a == 255 {
		return r, g, b, a
	}

	return blend(r, a), blend(g, a), blend(b, a), a / 255
}

func calculatePixelBrightnessDelta(pixelA color.Color, pixelB color.Color) float64 {

	r1, g1, b1, a1 := normalize(pixelA)
	r2, g2, b2, a2 := normalize(pixelB)

	r1, g1, b1, _ = blendSemiTransparentColor(r1, g1, b1, a1)
	r2, g2, b2, _ = blendSemiTransparentColor(r2, g2, b2, a2)

	return rgb2y(r1, g1, b1) - rgb2y(r2, g2, b2)
}

// MaxDelta is a max value of Delta func.
const MaxDelta = 35215.0
