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

// This assumes that all dependencies of the build have been processed
// This will add any builds failed/aborted parents to our parent list. We will also be leaving the failed/aborted parents in the list
func (q *BuildQueriesTx) squashFailedOrAbortedParents(ctx context.Context, buildID string) error {
	query := `INSERT INTO build_history (parent_id, child_id) SELECT bh.parent_id, build_history.child_id FROM build_history JOIN build_history AS bh ON bh.child_id = build_history.parent_id JOIN build ON build_history.parent_id = build.id WHERE build_history.child_id = $1 AND build.status in ('failed', 'aborted') ON CONFLICT DO NOTHING`

	_, err := q.ExecContext(ctx, query, buildID)

	return err
}

// This assumes that all dependencies of the build have been processed
// This will add any builds failed/aborted targets parents to our target list. We will also be leaving the failed/aborted targets in the list
func (q *BuildQueriesTx) squashFailedOrAbortedTargets(ctx context.Context, buildID string) error {
	query := `INSERT INTO build_targets (build_id, target_id) SELECT bt.build_id, bh.parent_id FROM build_targets AS bt JOIN build ON bt.target_id = build.id JOIN build_history AS bh ON bh.child_id = bt.target_id WHERE bt.build_id = $1 AND build.status in ('failed', 'aborted') ON CONFLICT DO NOTHING`

	_, err := q.ExecContext(ctx, query, buildID)

	return err
}

// This assumes that all dependencies of the build have been processed
func (q *BuildQueriesTx) SquashDependencies(ctx context.Context, buildID string) error {
	if err := q.squashFailedOrAbortedParents(ctx, buildID); err != nil {
		return err
	}

	if err := q.squashFailedOrAbortedTargets(ctx, buildID); err != nil {
		return err
	}

	return nil
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
	// recursive query that selects all builds with a sha in the list of shas and that aren't parents of any other build in the list
	query := `
	WITH RECURSIVE find_latest_builds AS (
		SELECT build.*, 0 as depth, build.sha as base_sha FROM build WHERE project_id = ? AND status NOT IN ('failed', 'aborted') AND sha in (?)
		
		UNION ALL
		
		SELECT b.*, latest.depth + 1, latest.base_sha FROM build b
		INNER JOIN build_history bh on bh.child_id = b.id
		INNER JOIN find_latest_builds latest ON bh.parent_id = latest.id
		WHERE b.status NOT IN ('failed', 'aborted')
		
		
	)
	SELECT DISTINCT ON (sha) id, created_at, updated_at, project_id, build_number, status, sha, branch, message, title, warnings, errors FROM (SELECT DISTINCT ON (base_sha) * from find_latest_builds WHERE sha in (?) ORDER BY base_sha, build_number DESC) as data
			
	`

	query, args, err := sqlx.In(query, projectID, shas, shas)
	if err != nil {
		return builds, err
	}
	query = q.Rebind(query)

	err = q.SelectContext(ctx, &builds, query, args...)

	return builds, err
}
