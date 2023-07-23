package queries

import (
	"context"
	"net/http"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/app/models"
)

type BuildQueries struct {
	*sqlx.DB
}

// This assumes that the user hasn't renamed their branches
// You should always check that the builds commit sha is in the history of head
func (q *BuildQueries) GetBuildFromBranch(projectID uuid.UUID, branch string) (models.Build, error) {
	build := models.Build{}

	query := `SELECT * FROM build WHERE project_id = $1 AND branch = $2 ORDER BY build_number DESC LIMIT 1`

	err := q.Get(&build, query, projectID, branch)

	return build, err
}

func (q *BuildQueries) GetBuildFromCommits(projectID uuid.UUID, shas []string) (models.Build, error) {
	build := models.Build{}

	query := `SELECT * FROM build WHERE project_id = $1 AND sha = ANY($2) ORDER BY build_number DESC LIMIT 1`

	err := q.Get(&build, query, projectID, shas)

	return build, err
}

func (q *BuildQueries) GetBuild(id uuid.UUID) (models.Build, error) {
	build := models.Build{}

	query := `SELECT * FROM build WHERE id = $1`

	err := q.Get(&build, query, id)

	return build, err
}

func (q *BuildQueries) CreateBuild(build *models.Build) error {
	query := `INSERT INTO build (id, sha, branch, author, title, message, status) VALUES (:id, :sha, :branch, :author, :title, :message, :status)`

	_, err := q.NamedExec(query, build)

	return err
}

func (q *BuildQueries) UpdateBuild(build *models.Build) error {
	query := `UPDATE build SET sha = :sha, branch = :branch, author = :author, title = :title, message = :message, status = :status, errors = :errors WHERE id = :id`

	_, err := q.NamedExec(query, build)

	return err
}

func (q *BuildQueries) CompleteBuild(id uuid.UUID) (models.Build, error) {

	selectBuildQuery := `SELECT * FROM build WHERE id = $1 FOR UPDATE`
	selectSnapshotsQuery := `SELECT status FROM snapshot WHERE build_id = $1 FOR UPDATE`
	updateBuildQuery := `UPDATE build SET status = $1 WHERE id = $2`

	build := models.Build{}

	ctx := context.Background()

	tx, err := q.BeginTxx(ctx, nil)

	if err != nil {
		return build, err
	}

	defer tx.Rollback()

	if err = tx.GetContext(ctx, &build, selectBuildQuery, id); err != nil {
		return build, echo.NewHTTPError(http.StatusNotFound, "build with given ID not found")
	}

	if build.Status != models.BUILD_STATUS_UPLOADING && build.Status != models.BUILD_STATUS_ABORTED {
		// Build has already been marked as complete
		return build, echo.NewHTTPError(http.StatusBadRequest, "build has already been marked as complete")
	}

	if build.Status == models.BUILD_STATUS_ABORTED {
		// Something went wrong during processing.
		build.Status = models.BUILD_STATUS_FAILED
	} else {

		snapshotStatus := []string{}

		if err = tx.SelectContext(ctx, &snapshotStatus, selectSnapshotsQuery, build.ID); err != nil {
			return build, err
		}

		// Since snapshot processing is asynchronous, we can check the status of each snapshot to determine the overall build status.
		// If snapshots are still processing, we assume the build is still processing.
		// TODO - Ensure the ingest microservice updates the build status if the last snapshot is processed.

		build.Status = models.BUILD_STATUS_UNCHANGED

		// if no snapshots were uploaded, so we can skip processing. We can assume that the build is unchanged.
		if len(snapshotStatus) != 0 {
			build.Status = models.BUILD_STATUS_UNCHANGED

			for _, status := range snapshotStatus {
				if status == models.SNAPSHOT_STATUS_FAILED || status == models.SNAPSHOT_STATUS_ABORTED {
					// Snapshots should only be marked as aborted if the build was aborted. We still want to check for this case though.
					build.Status = models.BUILD_STATUS_FAILED
					break // This is the 'worst' status, so we can break out of the loop.
				}
				if status == models.SNAPSHOT_STATUS_PROCESSING {
					build.Status = models.BUILD_STATUS_PROCESSING
				} else if status == models.SNAPSHOT_STATUS_UNREVIEWED && build.Status != models.BUILD_STATUS_PROCESSING {
					build.Status = models.BUILD_STATUS_UNREVIEWED
				}
			}
		}
	}

	if _, err = tx.ExecContext(ctx, updateBuildQuery, build.Status, build.ID); err != nil {
		return build, err
	}

	if err = tx.Commit(); err != nil {
		return build, err
	}

	return build, nil
}
