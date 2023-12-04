package imageDiff

import (
	"image"
	"image/color"

	"github.com/esimov/stackblur-go"
)

// Options struct.
type Options struct {
	Threshold float64
	Blur      bool
}

// Result struct.
type Result struct {
	Equal           bool
	Image           image.Image
	DiffPixelsCount uint64
}

// Diff between two images.
func Diff(image1 image.Image, image2 image.Image, options Options) (*Result, error) {

	if options.Blur {
		var err error
		image1, err = stackblur.Process(image1, 2)
		if err != nil {
			return nil, err
		}

		image2, err = stackblur.Process(image2, 2)
		if err != nil {
			return nil, err
		}
	}

	maxDelta := MaxDelta * options.Threshold * options.Threshold

	diff := image.NewNRGBA(image1.Bounds())

	var diffPixelsCount uint64 = 0

	for y := 0; y <= image1.Bounds().Max.Y; y += 1 {
		for x := 0; x <= image1.Bounds().Max.X; x++ {
			pixel1, pixel2 := image1.At(x, y), image2.At(x, y)

			if pixel1 != pixel2 {
				delta := Delta(pixel1, pixel2)

				if delta > maxDelta {
					diff.SetNRGBA(x, y, color.NRGBA{R: 255, G: 0, B: 0, A: 255})

					diffPixelsCount++
				}
			}
		}
	}

	return &Result{
		Equal:           diffPixelsCount == 0,
		DiffPixelsCount: diffPixelsCount,
		Image:           diff,
	}, nil
}
