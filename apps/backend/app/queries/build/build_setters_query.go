package build_queries

import (
	"context"
	"fmt"

	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/rs/zerolog/log"
)

func (tx *BuildQueriesTx) UpdateBuildStatus(ctx context.Context, build *models.Build) error {
	query := `UPDATE build SET status = :status, updated_at = :updated_at WHERE id = :id`

	build.UpdatedAt = utils.CurrentTime()

	_, err := tx.NamedExecContext(ctx, query, build)

	return err
}

func (tx *BuildQueriesTx) UpdateBuildShardsCompleted(ctx context.Context, build *models.Build) error {
	query := `UPDATE build SET shards_completed = :shards_completed, updated_at = :updated_at WHERE id = :id`

	build.UpdatedAt = utils.CurrentTime()

	_, err := tx.NamedExecContext(ctx, query, build)

	return err
}

// Creates a new build and updates the build history table accordingly
func (q *BuildQueries) CreateBuild(ctx context.Context, build *models.Build) error {
	selectProjectQuery := `SELECT * FROM project WHERE id = $1 FOR UPDATE`
	insertBuildQuery := `INSERT INTO build (id, sha, branch, title, message, status, project_id, created_at, updated_at, build_number, pr_id, target_branch, sharding_count, sharding_id) VALUES (:id, :sha, :branch, :title, :message, :status, :project_id, :created_at, :updated_at, :build_number, :pr_id, :target_branch, :sharding_count, :sharding_id) RETURNING *`
	updateBuildNumber := `UPDATE project SET build_count = $1 WHERE id = $2`
	buildHistoryQuery := `INSERT INTO build_history (parent_id, child_id) VALUES (:parent_id, :child_id) ON CONFLICT DO NOTHING`
	targetBuildQuery := `INSERT INTO build_targets (build_id, target_id) VALUES (:build_id, :target_id) ON CONFLICT DO NOTHING`

	parentIds := build.ParentIDs

	tx, err := NewBuildTx(q.DB, ctx)
	if err != nil {
		return err
	}

	completed := false
	defer func(completed *bool) {
		if !*completed {
			log.Error().Err(err).Msg("Rollback failed")
		}
	}(&completed)

	project := models.Project{}
	if err = tx.GetContext(ctx, &project, selectProjectQuery, build.ProjectID); err != nil {
		return err
	}

	build.Status = models.BUILD_STATUS_UPLOADING

	// We need to check if the ancestors of this build have completed, otherwise we need to queue this build
	for _, parentID := range parentIds {
		if parentBuild, err := tx.GetBuildForUpdate(ctx, parentID); err != nil {
			return err
		} else if !models.IsBuildPostProcessing(parentBuild.Status) {
			build.Status = models.BUILD_STATUS_QUEUED_UPLOADING
			break
		}
	}

	time := utils.CurrentTime()
	build.CreatedAt = time
	build.UpdatedAt = time
	build.IsLatest = true

	build.BuildNumber = project.BuildCount + 1

	// TODO - I think I can just remove this returned build stuff
	returnedBuild, err := tx.NamedQuery(insertBuildQuery, build)
	if err != nil {
		return err
	}

	if ok := returnedBuild.Next(); !ok {
		return fmt.Errorf("failed to get returned build after creation")
	}

	if err := returnedBuild.StructScan(build); err != nil {
		return err
	}

	returnedBuild.Close()

	if _, err := tx.ExecContext(ctx, updateBuildNumber, build.BuildNumber, build.ProjectID); err != nil {
		return err
	}

	buildHistoryEntries := []models.BuildHistory{}

	for _, parentID := range parentIds {
		buildHistoryEntries = append(buildHistoryEntries, models.BuildHistory{ParentID: parentID, ChildID: build.ID})
	}

	if len(buildHistoryEntries) > 0 {
		if _, err := tx.NamedExecContext(ctx, buildHistoryQuery, buildHistoryEntries); err != nil {
			log.Err(err).Msg("Failed to create build history entries")
			return err
		}
	}

	targetBuildEntries := []models.BuildTarget{}

	for _, targetID := range build.TargetBuildIDs {
		targetBuildEntries = append(targetBuildEntries, models.BuildTarget{BuildID: build.ID, TargetID: targetID})
	}

	if len(targetBuildEntries) > 0 {
		if _, err := tx.NamedExecContext(ctx, targetBuildQuery, targetBuildEntries); err != nil {
			log.Err(err).Msg("Failed to create build target entries")
			return err
		}
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	completed = true

	return nil
}

func (q *BuildQueries) GetAndFailStuckBuilds(ctx context.Context) ([]models.Build, error) {
	selectQuery := `UPDATE build
	SET status = 'failed', errors = '{"Build was idle for too long and has been failed."}'
	WHERE 
		(status IN ('uploading', 'queued-uploading') AND updated_at < NOW() - INTERVAL '120 minute')
		OR 
		(status = 'processing' AND updated_at < NOW() - INTERVAL '30 minute')
	RETURNING *`

	res, err := q.DB.QueryContext(ctx, selectQuery)
	if err != nil {
		return nil, err
	}

	builds := []models.Build{}
	for res.Next() {
		build := models.Build{}

		if err := res.Scan(&build); err != nil {
			return nil, err
		}

		builds = append(builds, build)
	}

	return builds, nil
}
