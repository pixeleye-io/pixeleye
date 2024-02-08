package imageDiff

import (
	"image"
)

type _image struct {
	image.Image
}

func hasManySiblings(x1 int, y1 int, width int, height int, img *_image) bool {

	x0 := max(x1-1, 0)
	y0 := max(y1-1, 0)
	x2 := min(x1+1, width-1)
	y2 := min(y1+1, height-1)

	zeros := 0
	if x1 == x0 || x1 == x2 || y1 == y0 || y1 == y2 {
		zeros = 1
	}

	baseColor := img.At(x1, y1)

	for x := x0; x <= x2; x++ {
		for y := y0; y <= y2; y++ {

			if x1 != x || y1 != y {
				adjacentColor := img.At(x, y)

				if baseColor == adjacentColor {
					zeros++

					if zeros >= 3 {
						return true
					}
				}
			}

		}
	}

	return false
}

func detectAntiAliasing(x1, y1 int, img1, img2 *_image) bool {

	x0 := max(x1-1, 0)
	y0 := max(y1-1, 0)

	x2 := min(x1+1, img1.Bounds().Max.X)
	y2 := min(y1+1, img1.Bounds().Max.Y)

	minSiblingDelta := 0.0
	maxSiblingDelta := 0.0

	minSiblingDeltaCoord := [2]int{0, 0}
	maxSiblingDeltaCoord := [2]int{0, 0}

	zeros := 0
	if x1 == x0 || x1 == x2 || y1 == y0 || y1 == y2 {
		zeros = 1
	}

	baseColor := img1.At(x1, y1)

	for x := x0; x <= x2; x++ {
		for y := y0; y <= y2; y++ {

			if x1 != x || y1 != y {
				adjacentColor := img1.At(x, y)

				if baseColor == adjacentColor {
					zeros++

					// We have found sufficient number of similar pixels so we can assume that anti-aliasing won't be detected
					if zeros >= 3 {
						return false
					}
				} else {

					delta := calculatePixelBrightnessDelta(baseColor, adjacentColor)

					if delta < minSiblingDelta {
						minSiblingDelta = delta
						minSiblingDeltaCoord = [2]int{x, y}
					} else if delta > maxSiblingDelta {
						maxSiblingDelta = delta
						maxSiblingDeltaCoord = [2]int{x, y}
					}
				}

			}

		}
	}

	// There are no darker or brighter pixels around
	if minSiblingDelta == 0 && maxSiblingDelta == 0 {
		return false
	}

	minX := minSiblingDeltaCoord[0]
	minY := minSiblingDeltaCoord[1]

	maxX := maxSiblingDeltaCoord[0]
	maxY := maxSiblingDeltaCoord[1]

	return (hasManySiblings(minX, minY, img1.Bounds().Max.X, img1.Bounds().Max.Y, img1) ||
		hasManySiblings(maxX, maxY, img1.Bounds().Max.X, img1.Bounds().Max.Y, img1)) &&
		(hasManySiblings(minX, minY, img2.Bounds().Max.X, img2.Bounds().Max.Y, img2) ||
			hasManySiblings(maxX, maxY, img2.Bounds().Max.X, img2.Bounds().Max.Y, img2))

}
