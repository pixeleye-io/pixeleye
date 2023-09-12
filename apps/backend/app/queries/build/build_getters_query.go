package build_queries

import (
	"context"

	"github.com/jmoiron/sqlx"
	"github.com/pixeleye-io/pixeleye/app/models"
)

// You should always check that the builds commit sha is in the history of head
func (q *BuildQueries) GetBuildFromBranch(projectID string, branch string) (models.Build, error) {
	// TODO - We should make sure we ignore failed builds
	build := models.Build{}

	query := `SELECT * FROM build WHERE project_id = $1 AND branch = $2 ORDER BY build_number DESC LIMIT 1`

	err := q.Get(&build, query, projectID, branch)

	return build, err
}

func (q *BuildQueries) GetBuildFromCommits(projectID string, shas []string) (models.Build, error) {
	build := models.Build{}

	arg := map[string]interface{}{
		"project_id": projectID,
		"shas":       shas,
	}

	query, args, err := sqlx.Named(`SELECT * FROM build WHERE project_id=:project_id AND sha IN (:shas) ORDER BY build_number DESC LIMIT 1`, arg)
	if err != nil {
		return build, err
	}
	query, args, err = sqlx.In(query, args...)
	if err != nil {
		return build, err
	}
	query = q.Rebind(query)

	if err != nil {
		return build, err
	}

	err = q.Get(&build, query, args...)

	return build, err
}

func (q *BuildQueries) GetBuild(id string) (models.Build, error) {
	build := models.Build{}

	query := `SELECT build.*, NOT EXISTS(SELECT build.id FROM build WHERE target_parent_id = $1) AS is_latest FROM build WHERE id = $1`

	err := q.Get(&build, query, id)

	return build, err
}

func (tx *BuildQueriesTx) GetBuildForUpdate(ctx context.Context, id string) (models.Build, error) {
	build := models.Build{}

	query := `SELECT * FROM build WHERE id = $1 FOR UPDATE`

	err := tx.GetContext(ctx, &build, query, id)

	return build, err
}

func (q *BuildQueries) SelectChildBuilds(ctx context.Context, id string) ([]models.Build, error) {

	builds := []models.Build{}

	query := `SELECT build.* FROM build JOIN build_history ON build_history.parent_id = build.id WHERE build.id = $1 ORDER BY build.build_number ASC`

	err := q.SelectContext(ctx, &builds, query, id)

	return builds, err
}
