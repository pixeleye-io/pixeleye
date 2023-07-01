package queries

import (
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/pixeleye-io/pixeleye/app/models"
)

type BuildQueries struct {
	*sqlx.DB
}

func (q *BuildQueries) GetBuild(id uuid.UUID) (models.Build, error) {
	build := models.Build{}

	query := `SELECT * FROM build WHERE id = $1`

	err := q.Get(&build, query, id)

	return build, err
}

func (q *BuildQueries) CreateBuild(build *models.Build) error {
	query := `INSERT INTO build (id, sha, branch, author, title, message) VALUES (:id, :sha, :branch, :author, :title, :message)`

	_, err := q.NamedExec(query, build)

	return err
}
