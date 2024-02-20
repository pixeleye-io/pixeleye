package queries

import (
	"context"

	"github.com/jmoiron/sqlx"
	nanoid "github.com/matoous/go-nanoid/v2"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
)

type SnapImageQueries struct {
	*sqlx.DB
}

func (q *SnapImageQueries) GetSnapImageByHash(ctx context.Context, hash string, projectID string) (models.SnapImage, error) {
	snapImage := models.SnapImage{}

	query := `SELECT * FROM snap_image WHERE hash = $1 AND project_id = $2`

	err := q.GetContext(ctx, &snapImage, query, hash, projectID)

	return snapImage, err
}

func (q *SnapImageQueries) GetSnapImagesByHashes(ctx context.Context, hashes []string, projectID string) ([]models.SnapImage, error) {

	defer utils.LogTimeTaken(utils.CurrentTime(), "GetSnapImagesByHashes")

	snapImages := []models.SnapImage{}

	query, args, err := sqlx.In(`SELECT * FROM snap_image WHERE project_id = ? AND hash IN (?)`, projectID, hashes)
	if err != nil {
		return snapImages, err
	}

	query = q.Rebind(query)

	err = q.SelectContext(ctx, &snapImages, query, args...)

	return snapImages, err
}

func (q *SnapImageQueries) GetSnapImages(id ...string) ([]models.SnapImage, error) {
	snapImages := []models.SnapImage{}

	query, args, err := sqlx.In(`SELECT * FROM snap_image WHERE id IN (?)`, id)
	if err != nil {
		return snapImages, err
	}

	query = q.Rebind(query)

	err = q.Select(&snapImages, query, args...)

	return snapImages, err
}

func (q *SnapImageQueries) CreateSnapImage(snapImage *models.SnapImage) error {
	query := `INSERT INTO snap_image (id, hash, project_id, created_at, height, width, format) VALUES (:id, :hash, :project_id, :created_at, :height, :width, :format)`

	snapImage.CreatedAt = utils.CurrentTime()

	var err error
	if snapImage.ID, err = nanoid.New(); err != nil {
		return err
	}

	_, err = q.NamedExec(query, snapImage)

	return err
}

func (q *SnapImageQueries) BatchCreateSnapImage(ctx context.Context, snapImages []models.SnapImage) error {
	query := `INSERT INTO snap_image (id, hash, project_id, created_at, height, width, format) VALUES (:id, :hash, :project_id, :created_at, :height, :width, :format)`

	_, err := q.NamedExecContext(ctx, query, snapImages)

	return err
}

func (q *SnapImageQueries) SetSnapImageExists(ctx context.Context, id string, exists bool) error {
	query := `UPDATE snap_image SET exists = $1 WHERE id = $2`

	_, err := q.ExecContext(ctx, query, exists, id)

	return err
}
