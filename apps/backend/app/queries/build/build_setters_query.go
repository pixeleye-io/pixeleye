package build_queries

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/rs/zerolog/log"
)

func (tx *BuildQueriesTx) UpdateBuild(ctx context.Context, build *models.Build) error {
	query := `UPDATE build SET sha = :sha, branch = :branch, title = :title, message = :message, status = :status, errors = :errors, updated_at = :updated_at WHERE id = :id`

	build.UpdatedAt = utils.CurrentTime()

	_, err := tx.NamedExecContext(ctx, query, build)

	return err
}

// Creates a new build and updates the build history table accordingly
func (q *BuildQueries) CreateBuild(ctx context.Context, build *models.Build) error {
	selectProjectQuery := `SELECT * FROM project WHERE id = $1 FOR UPDATE`
	insertBuildQuery := `INSERT INTO build (id, sha, branch, title, message, status, project_id, created_at, updated_at, target_parent_id, target_build_id, build_number) VALUES (:id, :sha, :branch, :title, :message, :status, :project_id, :created_at, :updated_at, :target_parent_id, :target_build_id, :build_number) RETURNING *`
	buildHistoryQuery := `INSERT INTO build_history (parent_id, child_id) VALUES (:parent_id, :child_id)`
	updateBuildNumber := `UPDATE project SET build_count = $1 WHERE id = $2`

	tx, err := NewBuildTx(q.DB, ctx)

	if err != nil {
		return err
	}

	// nolint:errcheck
	defer tx.Rollback()

	project := models.Project{}
	if err = tx.GetContext(ctx, &project, selectProjectQuery, build.ProjectID); err != nil {
		return err
	}

	parent, err := tx.GetBuildForUpdate(ctx, build.TargetParentID)

	if err != nil && err != sql.ErrNoRows {
		return err
	}

	if err != sql.ErrNoRows && !models.IsBuildPostProcessing(parent.Status) {
		// We can't start processing this build until the parent build has finished processing
		log.Debug().Msgf("Parent build %s is still processing", parent.ID)
		build.Status = models.BUILD_STATUS_QUEUED_UPLOADING
	} else {
		build.Status = models.BUILD_STATUS_UPLOADING
	}

	time := utils.CurrentTime()
	build.CreatedAt = time
	build.UpdatedAt = time
	build.IsLatest = true

	build.BuildNumber = project.BuildCount + 1

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

	for _, parentID := range build.ParentBuildIDs {
		buildHistoryEntries = append(buildHistoryEntries, models.BuildHistory{ParentID: parentID, ChildID: build.ID})
	}

	if len(buildHistoryEntries) > 0 {
		if _, err := tx.NamedExecContext(ctx, buildHistoryQuery, buildHistoryEntries); err != nil {
			log.Err(err).Msg("Failed to create build history entries")
			return err
		}
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	return nil
}

func (q *BuildQueries) CompleteBuild(ctx context.Context, id string) (models.Build, error) {

	tx, err := NewBuildTx(q.DB, ctx)

	if err != nil {
		return models.Build{}, err
	}

	// nolint:errcheck
	defer tx.Rollback()

	build, err := tx.GetBuildForUpdate(ctx, id)

	if err != nil {
		return build, err
	}

	if !models.IsBuildPreProcessing(build.Status) {
		// Build has already been marked as complete
		return build, fmt.Errorf("build has already been marked as complete")
	}

	var status string
	if status == models.BUILD_STATUS_QUEUED_UPLOADING {
		status = models.BUILD_STATUS_QUEUED_PROCESSING
	} else {
		build.Status = models.BUILD_STATUS_PROCESSING // We need to set this before we calculate the true status
		status, err = tx.CalculateBuildStatus(ctx, build)
		if err != nil {
			return build, err
		}
	}

	build.Status = status

	if err := tx.UpdateBuild(ctx, &build); err != nil {
		return build, err
	}

	return build, tx.Commit()
}

func (q *BuildQueries) UpdateStuckBuilds(ctx context.Context) error {
	selectQuery := `SELECT * FROM build WHERE status IN ('processing', 'uploading') AND updated_at < NOW() - INTERVAL '15 minute' FOR UPDATE`

	tx, err := NewBuildTx(q.DB, ctx)

	if err != nil {
		return err
	}

	// nolint:errcheck
	defer tx.Rollback()

	builds := []models.Build{}

	if err := tx.SelectContext(ctx, &builds, selectQuery); err != nil {
		return err
	}

	for _, build := range builds {
		build.Status = models.BUILD_STATUS_FAILED
		if err := tx.UpdateBuild(ctx, &build); err != nil {
			return err
		}
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	for _, build := range builds {
		if err := q.CheckAndProcessQueuedBuilds(ctx, build); err != nil {
			log.Debug().Err(err).Msgf("Failed to process queued builds for build %s", build.ID)
		}
	}

	return nil
}
