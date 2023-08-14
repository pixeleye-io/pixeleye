package queries

import (
	"context"
	"net/http"

	"github.com/jmoiron/sqlx"
	"github.com/labstack/echo/v4"
	"github.com/lib/pq"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/rs/zerolog/log"
)

type BuildQueries struct {
	*sqlx.DB
}

// TODO - Add returns to queries like user queries

// This assumes that the user hasn't renamed their branches
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

	query := `SELECT * FROM build WHERE id = $1`

	err := q.Get(&build, query, id)

	return build, err
}

// TODO - make sure when approving a build that it is the latest build

func (q *BuildQueries) CreateBuild(build *models.Build) error {
	query := `INSERT INTO build (id, sha, branch, title, message, status, project_id, created_at, updated_at, target_parent_id, target_build_id, approved_by) VALUES (:id, :sha, :branch, :title, :message, :status, :project_id, :created_at, :updated_at, :target_parent_id, :target_build_id, :approved_by)`

	buildHistoryQuery := `INSERT INTO build_history (parent_id, child_id) VALUES (:parent_id, :child_id)`

	time := utils.CurrentTime()
	build.CreatedAt = time
	build.UpdatedAt = time

	if err := utils.TrimStruct(&build); err != nil {
		return err
	}

	ctx := context.Background()

	tx, err := q.BeginTxx(ctx, nil)

	if err != nil {
		return err
	}

	// nolint:errcheck
	defer tx.Rollback()

	if _, err := tx.NamedExec(query, build); err != nil {
		if driverErr, ok := err.(*pq.Error); ok && driverErr.Code == pq.ErrorCode("23505") {
			log.Error().Err(err).Msg("Failed to create build, build number already exists. Retrying...")
			if _, err = tx.NamedExec(query, build); err != nil {
				log.Error().Err(err).Msg("Failed to create build")
				return err
			}
		} else {
			log.Error().Err(err).Msg("Failed to create build")
			return err
		}
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

	return tx.Commit()
}

func (q *BuildQueries) UpdateBuild(build *models.Build) error {
	query := `UPDATE build SET sha = :sha, branch = :branch, title = :title, message = :message, status = :status, errors = :errors, updated_at = :updated_at WHERE id = :id`

	build.UpdatedAt = utils.CurrentTime()

	if err := utils.TrimStruct(&build); err != nil {
		return err
	}

	_, err := q.NamedExec(query, build)

	return err
}

func tryGetBuildStatus(tx *sqlx.Tx, ctx context.Context, id string) (string, error) {
	selectBuildQuery := `SELECT * FROM build WHERE id = $1 FOR UPDATE`
	selectSnapshotsQuery := `SELECT status FROM snapshot WHERE build_id = $1 FOR UPDATE`

	build := models.Build{}

	if err := tx.GetContext(ctx, &build, selectBuildQuery, id); err != nil {
		return "", err
	}

	if build.Status != models.BUILD_STATUS_UPLOADING && build.Status != models.BUILD_STATUS_ABORTED {
		// Build isn't processing, so we don't need to do anything
		return build.Status, nil
	}

	if build.TargetBuildID == "" && build.TargetParentID == "" {
		// This is the first build in the chain, so we can assume that it is unchanged.
		return models.BUILD_STATUS_ORPHANED, nil
	}

	if build.Status == models.BUILD_STATUS_ABORTED {
		// Something went wrong during processing.
		return models.BUILD_STATUS_FAILED, nil
	}

	snapshotStatus := []string{}

	if err := tx.SelectContext(ctx, &snapshotStatus, selectSnapshotsQuery, build.ID); err != nil {
		return "", err
	}

	// Since snapshot processing is asynchronous, we can check the status of each snapshot to determine the overall build status.
	// If snapshots are still processing, then the build is still processing.

	worstStatus := models.BUILD_STATUS_UNCHANGED

	if len(snapshotStatus) == 0 {
		// No snapshots were uploaded, so we can skip processing. We can assume that the build is unchanged.
		return models.BUILD_STATUS_UNCHANGED, nil
	}

	for _, status := range snapshotStatus {
		if status == models.SNAPSHOT_STATUS_FAILED || status == models.SNAPSHOT_STATUS_ABORTED {
			// Snapshots should only be marked as aborted if the build was aborted. We might as well check this just in case.
			// This is the 'worst' status, so we can break out of the loop.
			return models.BUILD_STATUS_FAILED, nil
		}
		if status == models.SNAPSHOT_STATUS_PROCESSING {
			worstStatus = models.BUILD_STATUS_PROCESSING
		} else if status == models.SNAPSHOT_STATUS_UNREVIEWED && build.Status != models.BUILD_STATUS_PROCESSING {
			worstStatus = models.BUILD_STATUS_UNREVIEWED
		}
	}

	return worstStatus, nil
}

func (q *BuildQueries) CheckAndUpdateStatusAccordingly(id string) (models.Build, error) {

	selectBuildQuery := `SELECT * FROM build WHERE id = $1 FOR UPDATE`
	updateBuildQuery := `UPDATE build SET status = $1, updated_at = $2 WHERE id = $3`

	ctx := context.Background()

	build := models.Build{}

	tx, err := q.BeginTxx(ctx, nil)

	if err != nil {
		return build, err
	}

	// nolint:errcheck
	defer tx.Rollback()

	if err = tx.GetContext(ctx, &build, selectBuildQuery, id); err != nil {
		return build, err
	}

	if build.Status == models.BUILD_STATUS_UPLOADING || build.Status == models.BUILD_STATUS_ABORTED {
		// Build is still uploading, so we don't need to do anything
		return build, nil
	}

	status, err := tryGetBuildStatus(tx, ctx, id)

	if err != nil {
		return build, err
	}

	if status == models.BUILD_STATUS_PROCESSING {
		// Build is still processing, so we don't need to do anything
		return build, nil
	}

	build.Status = status
	build.UpdatedAt = utils.CurrentTime()

	if _, err = tx.ExecContext(ctx, updateBuildQuery, build.Status, build.UpdatedAt, build.ID); err != nil {
		return build, err
	}

	return build, tx.Commit()
}

func (q *BuildQueries) CompleteBuild(id string) (models.Build, error) {

	selectBuildQuery := `SELECT * FROM build WHERE id = $1 FOR UPDATE`
	updateBuildQuery := `UPDATE build SET status = $1, updated_at = $2 WHERE id = $3`

	build := models.Build{}

	ctx := context.Background()

	tx, err := q.BeginTxx(ctx, nil)

	if err != nil {
		return build, err
	}

	// nolint:errcheck
	defer tx.Rollback()

	if err = tx.GetContext(ctx, &build, selectBuildQuery, id); err != nil {
		return build, echo.NewHTTPError(http.StatusNotFound, "build with given ID not found")
	}

	log.Debug().Msgf("Completing build %v", build)

	if build.Status != models.BUILD_STATUS_UPLOADING && build.Status != models.BUILD_STATUS_ABORTED {
		// Build has already been marked as complete
		return build, echo.NewHTTPError(http.StatusBadRequest, "build has already been marked as complete")
	}

	status, err := tryGetBuildStatus(tx, ctx, id)

	if err != nil {
		return build, err
	}

	build.Status = status

	build.UpdatedAt = utils.CurrentTime()

	if _, err = tx.ExecContext(ctx, updateBuildQuery, build.Status, build.UpdatedAt, build.ID); err != nil {
		return build, err
	}

	if err = tx.Commit(); err != nil {
		return build, err
	}

	return build, nil
}
