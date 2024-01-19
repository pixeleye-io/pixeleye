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

	query := `SELECT * FROM build WHERE project_id = $1 AND branch = $2 AND status != 'aborted' AND status !=  'failed' ORDER BY build_number DESC LIMIT 1`

	err := q.Get(&build, query, projectID, branch)

	return build, err
}

func (q *BuildQueries) GetBuildFromCommits(projectID string, shas []string) (models.Build, error) {
	build := models.Build{}

	arg := map[string]interface{}{
		"project_id": projectID,
		"shas":       shas,
	}

	query, args, err := sqlx.Named(`SELECT * FROM build WHERE project_id=:project_id AND status != 'aborted' AND status != 'failed' AND sha IN (:shas) ORDER BY build_number DESC LIMIT 1`, arg)
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

func (q *BuildQueries) GetBuild(ctx context.Context, id string) (models.Build, error) {
	build := models.Build{}

	query := `SELECT build.*, NOT EXISTS(SELECT * FROM build_history WHERE parent_id = $1) AS is_latest FROM build WHERE id = $1`

	err := q.GetContext(ctx, &build, query, id)

	return build, err
}

func (tx *BuildQueriesTx) GetBuildForUpdate(ctx context.Context, id string) (models.Build, error) {
	build := models.Build{}

	query := `SELECT * FROM build WHERE id = $1 FOR UPDATE`

	err := tx.GetContext(ctx, &build, query, id)

	return build, err
}

func (q *BuildQueries) CountBuildSnapshots(ctx context.Context, buildID string) (int64, error) {
	query := `SELECT COUNT(snapshot) FROM build JOIN snapshot ON snapshot.build_id = build.id WHERE build.id = $1`

	var count int64

	err := q.GetContext(ctx, &count, query, buildID)

	return count, err
}

func (q *BuildQueries) GetBuildParents(ctx context.Context, buildID string) ([]models.Build, error) {
	builds := []models.Build{}

	query := `SELECT build.* FROM build JOIN build_history ON build_history.parent_id = build.id WHERE build_history.child_id = $1`

	err := q.SelectContext(ctx, &builds, query, buildID)

	return builds, err
}
