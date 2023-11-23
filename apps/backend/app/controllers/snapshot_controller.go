package controllers

import (
	"database/sql"
	"net/http"
	"os"

	v4 "github.com/aws/aws-sdk-go-v2/aws/signer/v4"
	"github.com/labstack/echo/v4"
	nanoid "github.com/matoous/go-nanoid/v2"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/app/stores"
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

type SnapshotUpload struct {
	Hash   string `json:"hash" validate:"required,len=64"`
	Height int    `json:"height" validate:"required"`
	Width  int    `json:"width" validate:"required"`
	Format string `json:"format" validate:"required"`
}

type UploadSnapBody struct {
	SnapshotUploads []SnapshotUpload `json:"snapshots" validate:"required,dive"`
}

func createUploadURL(c echo.Context, data SnapshotUpload) (*UploadSnapReturn, error) {
	if data.Format != "image/png" {
		return nil, echo.NewHTTPError(http.StatusBadRequest, "Only PNG format is currently supported")
	}

	validate := utils.NewValidator()

	if err := validate.Struct(data); err != nil {
		return nil, echo.NewHTTPError(http.StatusBadRequest, utils.ValidatorErrors(err))
	}

	project := middleware.GetProject(c)

	db, err := database.OpenDBConnection()
	if err != nil {
		return nil, err
	}

	s3, err := storage.GetClient()
	if err != nil {
		return nil, err
	}

	path := stores.GetSnapPath(project.ID, data.Hash)

	fileExists, err := s3.KeyExists(c.Request().Context(), os.Getenv("S3_BUCKET"), path)
	if err != nil {
		return nil, err
	}

	snap, err := db.GetSnapImageByHash(data.Hash, project.ID)
	if err == nil && fileExists {
		// We already have this snapshot
		return &UploadSnapReturn{
			SnapImage: &snap,
		}, nil
	}

	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	url, err := s3.PutObject(c.Request().Context(), os.Getenv("S3_BUCKET"), path, "image/png", 900) // valid for 15 minutes
	if err != nil {
		return nil, err
	}

	id, err := nanoid.New()
	if err != nil {
		return nil, err
	}

	// We already have the snapshot but for some reason we don't have an upload
	if snap.ID != "" {
		log.Debug().Msg("We already have a snapshot but no file uploaded")
		return &UploadSnapReturn{
			SnapImage:            &snap,
			PresignedHTTPRequest: url,
		}, nil
	}

	snapImage := models.SnapImage{
		ID:        id,
		Hash:      data.Hash,
		ProjectID: project.ID,
		Height:    data.Height,
		Width:     data.Width,
		Format:    data.Format,
		CreatedAt: utils.CurrentTime(),
	}

	if err := validate.Struct(snapImage); err != nil {
		return nil, echo.NewHTTPError(http.StatusBadRequest, utils.ValidatorErrors(err))
	}

	if err := db.CreateSnapImage(&snapImage); err != nil {
		return nil, err
	}

	return &UploadSnapReturn{
		SnapImage:            &snapImage,
		PresignedHTTPRequest: url,
	}, nil
}

// Get a signed URL to upload a snapshot image.
// @Description Get a signed URL to upload a snapshot image.
// @Summary Get a signed URL to upload a snapshot image.
// @Tags Snapshot
// @Produce json
// @Param hash path string true "Snapshot hash"
// @Success 200 {object} UploadSnapReturn
// @Router /v1/snapshots/upload [post]
func CreateUploadURL(c echo.Context) error {

	body := UploadSnapBody{}

	if err := c.Bind(&body); err != nil {
		return err
	}

	uploadMap := map[string]*UploadSnapReturn{}

	ch := make(chan *UploadSnapReturn, len(body.SnapshotUploads))
	errs := make(chan error, len(body.SnapshotUploads))

	for _, data := range body.SnapshotUploads {

		go func(data SnapshotUpload) {
			uploadData, err := createUploadURL(c, data)

			if err != nil {
				errs <- err
				ch <- nil
			}

			ch <- uploadData
			errs <- nil
		}(data)
	}

	for i := 0; i < len(body.SnapshotUploads); i++ {
		err := <-errs
		if err != nil {
			return err
		}
		uploadData := <-ch
		uploadMap[uploadData.Hash] = uploadData
	}

	return c.JSON(http.StatusOK, uploadMap)
}

func GetSnapURL(c echo.Context) error {

	hash := c.Param("hash")

	if len(hash) != 64 {
		return echo.NewHTTPError(400, "Invalid hash, must be 64 characters long")
	}

	project := middleware.GetProject(c)

	imageStore, err := stores.GetImageStore(nil)

	if err != nil {
		return err
	}

	url, err := imageStore.GetSnapURL(project.ID, hash)

	if err == echo.ErrNotFound {
		return echo.NewHTTPError(404, "Snapshot not found")
	} else if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, UploadSnapReturn{
		PresignedHTTPRequest: url,
	})
}
