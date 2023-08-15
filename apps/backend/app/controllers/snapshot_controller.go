package controllers

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"

	v4 "github.com/aws/aws-sdk-go-v2/aws/signer/v4"
	"github.com/labstack/echo/v4"
	nanoid "github.com/matoous/go-nanoid/v2"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/pixeleye-io/pixeleye/platform/database"
	"github.com/pixeleye-io/pixeleye/platform/storage"
	"github.com/rs/zerolog/log"
)

type UploadSnapReturn struct {
	*models.SnapImage
	*v4.PresignedHTTPRequest
}

// Get a signed URL to upload a snapshot image.
// @Description Get a signed URL to upload a snapshot image.
// @Summary Get a signed URL to upload a snapshot image.
// @Tags Snapshot
// @Produce json
// @Param hash path string true "Snapshot hash"
// @Success 200 {object} UploadSnapReturn
// @Router /v1/snapshots/upload/{hash} [post]
func GetUploadURL(c echo.Context) error {

	// TODO - enable snapshot batching (multiple images in one request)
	// This will be a very active endpoint, so we should batch the requests

	hash := c.Param("hash")

	if len(hash) != 64 {
		return echo.NewHTTPError(400, "Invalid hash, must be 64 characters long")
	}

	project := middleware.GetProject(c)

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	s3, err := storage.GetClient()

	if err != nil {
		return err
	}

	path := fmt.Sprintf("snaps/%s/%s.png", project.ID, hash)

	fileExists, err := s3.FileExists(os.Getenv("S3_BUCKET"), path)

	if err != nil {
		return err
	}

	snap, err := db.GetSnapImageByHash(hash, project.ID)

	if err == nil && fileExists {
		// We already have this snapshot
		return c.JSON(http.StatusOK, UploadSnapReturn{
			SnapImage: &snap,
		})
	}

	if err != nil && err != sql.ErrNoRows {
		return err
	}

	url, err := s3.PutObject(os.Getenv("S3_BUCKET"), path, "image/png", 900) // valid for 15 minutes

	if err != nil {
		return err
	}

	id, err := nanoid.New()

	if err != nil {
		return err
	}

	// We already have the snapshot but for some reason we don't have an upload
	if snap.ID != "" {
		log.Debug().Msg("We already have a snapshot but no file uploaded")
		return c.JSON(http.StatusOK, UploadSnapReturn{
			SnapImage:            &snap,
			PresignedHTTPRequest: url,
		})
	}

	snapImage := models.SnapImage{
		ID:        id,
		Hash:      hash,
		ProjectID: project.ID,
		CreatedAt: utils.CurrentTime(),
	}

	validate := utils.NewValidator()

	if err := validate.Struct(snapImage); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, utils.ValidatorErrors(err))
	}

	if err := db.CreateSnapImage(&snapImage); err != nil {
		return err
	}

	return c.JSON(http.StatusOK, UploadSnapReturn{
		SnapImage:            &snapImage,
		PresignedHTTPRequest: url,
	})
}

func GetSnapURL(c echo.Context) error {

	hash := c.Param("hash")

	if len(hash) != 64 {
		return echo.NewHTTPError(400, "Invalid hash, must be 64 characters long")
	}

	project := middleware.GetProject(c)

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	if _, err = db.GetSnapImageByHash(hash, project.ID); err != nil {
		return echo.ErrNotFound
	}

	s3, err := storage.GetClient()

	if err != nil {
		return err
	}

	path := fmt.Sprintf("snaps/%s/%s.png", project.ID, hash)

	url, err := s3.GetObject(os.Getenv("S3_BUCKET"), path, 900) // valid for 15 minutes

	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, UploadSnapReturn{
		PresignedHTTPRequest: url,
	})
}
