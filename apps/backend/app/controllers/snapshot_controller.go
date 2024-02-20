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
	Hash   string `json:"hash" validate:"required,len=40"`
	Height int    `json:"height" validate:"required"`
	Width  int    `json:"width" validate:"required"`
	Format string `json:"format" validate:"required"`
}

type UploadSnapBody struct {
	SnapshotUploads []SnapshotUpload `json:"snapshots" validate:"required,dive"`
}

func createSnapImage(c echo.Context, db *database.Queries, data SnapshotUpload, snap *models.SnapImage, projectID string) (*UploadSnapReturn, error) {
	s3, err := storage.GetClient()
	if err != nil {
		return nil, err
	}

	path := stores.GetSnapPath(projectID, data.Hash)

	url, err := s3.PutObject(c.Request().Context(), os.Getenv("S3_BUCKET"), path, "image/png", 900) // valid for 15 minutes
	if err != nil {
		return nil, err
	}

	id, err := nanoid.New()
	if err != nil {
		return nil, err
	}

	if snap != nil {

		snap.Exists = true
		if err := db.SetSnapImageExists(c.Request().Context(), snap.ID, true); err != nil {
			return nil, err
		}

		return &UploadSnapReturn{
			PresignedHTTPRequest: url,
			SnapImage:            snap,
		}, nil
	}

	snapImage := &models.SnapImage{
		ID:        id,
		Hash:      data.Hash,
		ProjectID: projectID,
		Height:    data.Height,
		Width:     data.Width,
		Exists:    true,
		Format:    data.Format,
		CreatedAt: utils.CurrentTime(),
	}

	if err := db.CreateSnapImage(snapImage); err != nil {
		return nil, err
	}

	return &UploadSnapReturn{
		SnapImage:            snapImage,
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

	if len(body.SnapshotUploads) == 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "No snapshots to upload")
	}

	validate := utils.NewValidator()

	if err := validate.Struct(body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, utils.ValidatorErrors(err))
	}

	project := middleware.GetProject(c)

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	hashes := []string{}
	for _, data := range body.SnapshotUploads {
		hashes = append(hashes, data.Hash)
	}

	snaps, err := db.GetSnapImagesByHashes(c.Request().Context(), hashes, project.ID)
	if err != nil && err != sql.ErrNoRows {
		return err
	}

	uploadMap := map[string]*UploadSnapReturn{}
	for _, snap := range body.SnapshotUploads {
		var existingSnap *models.SnapImage = nil

		if uploadMap[snap.Hash] != nil {
			continue
		}

		for _, s := range snaps {
			if s.Hash == snap.Hash {
				existingSnap = &s
				break
			}
		}

		exists := false
		if existingSnap != nil && existingSnap.Exists {
			exists = true
		}

		log.Debug().Msgf("Snap %v exists: %v", snap.Hash, exists)

		if existingSnap != nil && exists {
			uploadMap[snap.Hash] = &UploadSnapReturn{
				SnapImage: existingSnap,
			}
		} else {
			snapReturn, err := createSnapImage(c, db, snap, existingSnap, project.ID)
			if err != nil {
				return err
			}
			snaps = append(snaps, *snapReturn.SnapImage) // we need to append the snap to the list of snaps so we don't create it again
			uploadMap[snap.Hash] = snapReturn
		}
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

func CreateSnapshotConversation(c echo.Context) error {

	snapshot, err := middleware.GetSnapshot(c)
	if err != nil {
		return err
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	conversation := &models.Conversation{
		SnapshotID: snapshot.ID,
		X:          0,
		Y:          0,
		CreatedAt:  utils.CurrentTime(),
	}

	if err := db.CreateConversation(c.Request().Context(), conversation); err != nil {
		return err
	}

	return c.JSON(http.StatusOK, conversation)
}

func GetConversationsWithMessages(c echo.Context) error {

	conversation, err := middleware.GetSnapshot(c)
	if err != nil {
		return err
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	conversations, err := db.GetSnapshotsConversationsWithMessages(c.Request().Context(), conversation.ID)
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, conversations)
}
