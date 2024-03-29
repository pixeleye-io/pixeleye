package build_queries

import (
	"context"

	"github.com/jmoiron/sqlx"
	"github.com/pixeleye-io/pixeleye/app/models"
)

func (q *BuildQueries) GetBuildFromShardID(ctx context.Context, projectID string, shardID string) (models.Build, error) {
	build := models.Build{}

	query := `SELECT * FROM build WHERE sharding_id = $1 AND project_id = $2`

	err := q.GetContext(ctx, &build, query, shardID, projectID)

	return build, err
}

// You should always check that the builds commit sha is in the history of head
func (q *BuildQueries) GetBuildFromBranch(projectID string, branch string) (models.Build, error) {
	// TODO - We should make sure we ignore failed builds
	build := models.Build{}

	query := `SELECT * FROM build WHERE project_id = $1 AND branch = $2 AND status != 'aborted' AND status !=  'failed' ORDER BY build_number DESC LIMIT 1`

	err := q.Get(&build, query, projectID, branch)

	return build, err
}

func (q *BuildQueries) GetBuildsFromCommitsWithBranch(ctx context.Context, projectID string, shas []string, branch string) ([]models.Build, error) {
	builds := []models.Build{}

	arg := map[string]interface{}{
		"project_id": projectID,
		"shas":       shas,
		"branch":     branch,
	}

	query, args, err := sqlx.Named(`SELECT * FROM build WHERE project_id=:project_id AND status != 'aborted' AND status != 'failed' AND sha IN (:shas) AND branch=:branch ORDER BY build_number DESC`, arg)
	if err != nil {
		return builds, err
	}
	query, args, err = sqlx.In(query, args...)
	if err != nil {
		return builds, err
	}
	query = q.Rebind(query)

	err = q.SelectContext(ctx, &builds, query, args...)

	return builds, err
}

func (q *BuildQueries) GetBuildsFromCommits(ctx context.Context, projectID string, shas []string) ([]models.Build, error) {
	builds := []models.Build{}

	arg := map[string]interface{}{
		"project_id": projectID,
		"shas":       shas,
	}

	query, args, err := sqlx.Named(`SELECT * FROM build WHERE project_id=:project_id AND status != 'aborted' AND status != 'failed' AND sha IN (:shas) ORDER BY build_number DESC`, arg)
	if err != nil {
		return builds, err
	}
	query, args, err = sqlx.In(query, args...)
	if err != nil {
		return builds, err
	}
	query = q.Rebind(query)

	err = q.SelectContext(ctx, &builds, query, args...)

	return builds, err
}

func (q *BuildQueries) GetBuild(ctx context.Context, id string) (models.Build, error) {
	build := models.Build{}

	query := `SELECT build.*, NOT EXISTS(SELECT * FROM build_history WHERE parent_id = $1) AS is_latest FROM build WHERE id = $1`

	err := q.GetContext(ctx, &build, query, id)

	return build, err
}

func (q *BuildQueries) GetBuildWithDependencies(ctx context.Context, id string) (models.Build, error) {

	build, err := q.GetBuild(ctx, id)
	if err != nil {
		return build, err
	}

	parents, err := q.GetBuildParents(ctx, id)
	if err != nil {
		return build, err
	}

	targets, err := q.GetBuildTargets(ctx, id)
	if err != nil {
		return build, err
	}

	for _, parent := range parents {
		build.ParentIDs = append(build.ParentIDs, parent.ID)
	}

	for _, target := range targets {
		build.TargetBuildIDs = append(build.TargetBuildIDs, target.ID)
	}

	return build, nil
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

	// recursive query to get all parents of a build, in the case where a parent has a status of failed or aborted, we'll find the parent of that build to replace it
	query := `
	WITH RECURSIVE find_parents AS (
		SELECT build.* FROM build JOIN build_history ON build_history.parent_id = build.id WHERE build_history.child_id = $1

		UNION ALL

		SELECT b.* FROM build b
		INNER JOIN build_history bh on bh.parent_id = b.id
		INNER JOIN find_parents ON bh.child_id = find_parents.id
		WHERE find_parents.status IN ('failed', 'aborted')
	)
	SELECT * FROM find_parents WHERE status NOT IN ('failed', 'aborted')
	`

	err := q.SelectContext(ctx, &builds, query, buildID)

	return builds, err
}

func (q *BuildQueries) GetDirectBuildChildren(ctx context.Context, buildID string) ([]models.Build, error) {
	builds := []models.Build{}

	query := `SELECT build.* FROM build JOIN build_history ON build_history.child_id = build.id WHERE build_history.parent_id = $1`

	err := q.SelectContext(ctx, &builds, query, buildID)

	return builds, err
}

func (q *BuildQueries) GetBuildTargets(ctx context.Context, buildID string) ([]models.Build, error) {

	builds := []models.Build{}

	// recursive query to get all targets of a build, in the case where a target has a status of failed or aborted, we'll find the target of that build to replace it
	query := `
	WITH RECURSIVE find_targets AS (
		SELECT build.* FROM build JOIN build_targets ON build_targets.target_id = build.id WHERE build_targets.build_id = $1

		UNION ALL

		SELECT b.* FROM build b
		INNER JOIN build_history bh on bh.parent_id = b.id
		INNER JOIN find_targets ON bh.child_id = find_targets.id
		WHERE find_targets.status IN ('failed', 'aborted')
	)

	SELECT * FROM find_targets WHERE status NOT IN ('failed', 'aborted')
	`

	err := q.SelectContext(ctx, &builds, query, buildID)

	return builds, err
}

func (q *BuildQueries) GetDirectBuildTargeters(ctx context.Context, buildID string) ([]models.Build, error) {
	builds := []models.Build{}

	query := `SELECT build.* FROM build JOIN build_targets ON build_targets.build_id = build.id WHERE build_targets.target_id = $1`

	err := q.SelectContext(ctx, &builds, query, buildID)

	return builds, err
}

func (q *BuildQueries) GetSnapshotsBuild(ctx context.Context, snapshotID string) (models.Build, error) {
	build := models.Build{}

	query := `SELECT build.* FROM build JOIN snapshot ON snapshot.build_id = build.id WHERE snapshot.id = $1`

	err := q.GetContext(ctx, &build, query, snapshotID)

	return build, err
}

func (q *BuildQueries) GetLatestBuildsFromShas(ctx context.Context, projectID string, shas []string) ([]models.Build, error) {
	builds := []models.Build{}

	// Fun recursive query to get the latest build for a given list of shas
	// We first get all builds with a given sha, then we recursively get their children and check if any also have a matching sha
	query := `
	WITH RECURSIVE build_tree AS (
		SELECT build.*, build_history.child_id, build.id as base_id
		FROM build
		LEFT JOIN build_history ON build.id = build_history.parent_id
		WHERE build.sha IN (?) AND build.project_id = ? AND build.status NOT IN ('failed', 'aborted')
	
		UNION ALL
	
		SELECT b.*, bh.child_id, bt.base_id
		FROM build b
		LEFT JOIN build_history bh ON b.id = bh.parent_id
		JOIN build_tree bt ON bt.child_id = b.id
	)

	SELECT id, created_at, updated_at, project_id, build_number, status, sha, branch, message, title, warnings, errors FROM build WHERE sha IN (?) AND project_id = ? AND status NOT IN ('failed', 'aborted') AND NOT EXISTS(SELECT * FROM build_tree WHERE build_tree.sha in (?) AND build_tree.base_id = build.id AND build_tree.id != build.id AND build_tree.status NOT IN ('failed', 'aborted'))	
	`

	query, args, err := sqlx.In(query, shas, projectID, shas, projectID, shas)
	if err != nil {
		return builds, err
	}
	query = q.Rebind(query)

	err = q.SelectContext(ctx, &builds, query, args...)

	return builds, err
}
