package queries

import (
	"github.com/jmoiron/sqlx"
	nanoid "github.com/matoous/go-nanoid/v2"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
)

type DiffImageQueries struct {
	*sqlx.DB
}

func (q *DiffImageQueries) GetDiffImage(hash string, projectID string) (models.DiffImage, error) {
	diffImage := models.DiffImage{}

	query := `SELECT * FROM diff_image WHERE hash = $1 AND project_id = $2`

	err := q.Get(&diffImage, query, hash, projectID)

	return diffImage, err
}

func (q *DiffImageQueries) CreateDiffImage(diffImage *models.DiffImage) error {
	query := `INSERT INTO diff_image (id, hash, project_id, created_at, width, height, format) VALUES (:id, :hash, :project_id, :created_at, :width, :height, :format) ON CONFLICT DO NOTHING`

	diffImage.CreatedAt = utils.CurrentTime()

	id, err := nanoid.New()
	if err != nil {
		return err
	}

	diffImage.ID = id

	_, err = q.NamedExec(query, diffImage)

	return err
}
