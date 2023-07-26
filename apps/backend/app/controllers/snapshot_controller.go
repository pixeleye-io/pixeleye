package controllers

import (
	"os"

	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/platform/storage"
)

func GetUploadURL(c echo.Context) error {

	s3, err := storage.GetClient()

	if err != nil {
		return err
	}

	url, err := s3.PutObject(os.Getenv("S3_BUCKET"), "test", "image/png", 900)

	if err != nil {
		return err
	}

	return c.JSON(200, url)
}
