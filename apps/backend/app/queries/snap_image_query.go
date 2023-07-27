package queries

import (
	"time"

	"github.com/jmoiron/sqlx"
	nanoid "github.com/matoous/go-nanoid/v2"
	"github.com/pixeleye-io/pixeleye/app/models"
)

type SnapImageQueries struct {
	*sqlx.DB
}

func (q *SnapImageQueries) GetSnapImage(hash string, projectID string) (models.SnapImage, error) {
	snapImage := models.SnapImage{}

	query := `SELECT * FROM snap_image WHERE hash = $1 AND project_id = $2`

	err := q.Get(&snapImage, query, hash, projectID)

	return snapImage, err
}

func (q *SnapImageQueries) CreateSnapImage(snapImage *models.SnapImage) error {
	query := `INSERT INTO snap_image (id, hash, project_id, created_at) VALUES (:id, :hash, :project_id, :created_at)`

	snapImage.CreatedAt = time.Now()

	var err error
	if snapImage.ID, err = nanoid.New(); err != nil {
		return err
	}

	_, err = q.NamedExec(query, snapImage)

	return err
}
