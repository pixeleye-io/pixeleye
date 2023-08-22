package queries

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"

	"github.com/jmoiron/sqlx"
	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/app/events"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/app/stores"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/pixeleye-io/pixeleye/platform/broker"
	"github.com/rs/zerolog/log"
)

type BuildQueries struct {
	*sqlx.DB
}

// TODO - Queued builds needs to be reworked when we add pull request support

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

func (q *BuildQueries) GetBuildForUpdate(tx *sqlx.Tx, ctx context.Context, id string) (models.Build, error) {
	build := models.Build{}

	query := `SELECT * FROM build WHERE id = $1 FOR UPDATE`

	err := tx.GetContext(ctx, &build, query, id)

	return build, err
}

type PairedSnapshot struct {
	models.Snapshot
	SnapHash *string `db:"snap_hash" json:"snapHash,omitempty"`

	BaselineHash *string `db:"baseline_hash" json:"baselineHash,omitempty"`
	DiffHash     *string `db:"diff_hash" json:"diffHash,omitempty"`

	SnapURL    *string `db:"snap_url" json:"snapURL,omitempty"`
	SnapHeight *int    `db:"snap_height" json:"snapHeight,omitempty"`
	SnapWidth  *int    `db:"snap_width" json:"snapWidth,omitempty"`

	BaselineURL    *string `db:"baseline_url" json:"baselineURL,omitempty"`
	BaselineHeight *int    `db:"baseline_height" json:"baselineHeight,omitempty"`
	BaselineWidth  *int    `db:"baseline_width" json:"baselineWidth,omitempty"`

	DiffURL    *string `db:"diff_url" json:"diffURL,omitempty"`
	DiffHeight *int    `db:"diff_height" json:"diffHeight,omitempty"`
	DiffWidth  *int    `db:"diff_width" json:"diffWidth,omitempty"`
}

// Fetches all snapshots for a build and includes their comparisons
// Primary use is for our reviewer ui
func (q *BuildQueries) GetBuildsPairedSnapshots(build models.Build) ([]PairedSnapshot, error) {
	pairs := []PairedSnapshot{}

	imageStore, err := stores.GetImageStore(nil)

	if err != nil {
		return pairs, err
	}

	query := `
		SELECT
			snapshot.*,
			snapshot_image.hash AS snap_hash,
			snapshot_image.height AS snap_height,
			snapshot_image.width AS snap_width,

			baseline_image.hash AS baseline_hash,
			baseline_image.height AS baseline_height,
			baseline_image.width AS baseline_width,

			diff_image.hash AS diff_hash,
			diff_image.height AS diff_height,
			diff_image.width AS diff_width
		FROM
			snapshot
		LEFT JOIN snap_image AS snapshot_image ON snapshot.snap_image_id = snapshot_image.id
		LEFT JOIN snapshot AS baseline ON snapshot.baseline_snapshot_id = baseline.id
		LEFT JOIN snap_image AS baseline_image ON baseline.snap_image_id = baseline_image.id
		LEFT JOIN diff_image ON snapshot.diff_image_id = diff_image.id
		WHERE
			snapshot.build_id = $1
	`

	if err := q.Select(&pairs, query, build.ID); err != nil {
		return pairs, err
	}

	for i := range pairs {
		if pairs[i].SnapHash != nil {
			hash := *pairs[i].SnapHash
			snapURL, err := imageStore.GetSnapURL(hash, build.ProjectID)
			if err == nil {
				pairs[i].SnapURL = &snapURL.URL
			} else {
				log.Error().Err(err).Msgf("Failed to get snapshot hash %s and projectID %s", hash, build.ProjectID)
			}
		}
		if pairs[i].BaselineHash != nil {
			hash := *pairs[i].BaselineHash
			baselineURL, err := imageStore.GetSnapURL(hash, build.ProjectID)
			if err == nil {
				pairs[i].BaselineURL = &baselineURL.URL
			} else {
				log.Error().Err(err).Msgf("Failed to get baseline hash %s and projectID %s", hash, build.ProjectID)
			}
		}
		if pairs[i].DiffHash != nil {
			hash := *pairs[i].DiffHash
			diffURL, err := imageStore.GetDiffURL(hash, build.ProjectID)
			if err == nil {
				pairs[i].DiffURL = &diffURL.URL
			} else {
				log.Error().Err(err).Msgf("Failed to get diff hash %s and projectID %s", hash, build.ProjectID)
			}
		}
	}

	return pairs, nil
}

// Creates a new build and updates the build history table accordingly
func (q *BuildQueries) CreateBuild(build *models.Build) error {
	selectProjectQuery := `SELECT * FROM project WHERE id = $1 FOR UPDATE`
	insertBuildQuery := `INSERT INTO build (id, sha, branch, title, message, status, project_id, created_at, updated_at, target_parent_id, target_build_id, build_number) VALUES (:id, :sha, :branch, :title, :message, :status, :project_id, :created_at, :updated_at, :target_parent_id, :target_build_id, :build_number) RETURNING *`
	buildHistoryQuery := `INSERT INTO build_history (parent_id, child_id) VALUES (:parent_id, :child_id)`
	updateBuildNumber := `UPDATE project SET build_count = $1 WHERE id = $2`

	ctx := context.TODO()

	tx, err := q.BeginTxx(ctx, nil)

	if err != nil {
		return err
	}

	// nolint:errcheck
	defer tx.Rollback()

	parent, err := q.GetBuildForUpdate(tx, ctx, build.TargetParentID)

	if err != nil && err != sql.ErrNoRows {
		return err
	}

	if err != sql.ErrNoRows && !models.IsBuildComplete(parent.Status) {
		// We can't start processing this build until the parent build has finished processing
		build.Status = models.BUILD_STATUS_QUEUED_UPLOADING
	}

	time := utils.CurrentTime()
	build.CreatedAt = time
	build.UpdatedAt = time

	if err := utils.TrimStruct(&build); err != nil {
		return err
	}

	project := models.Project{}
	if err = tx.GetContext(ctx, &project, selectProjectQuery, build.ProjectID); err != nil {
		return err
	}

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

	// We can notify all our subscribers that a new build has been created
	go func(build models.Build) {
		notifier, err := events.GetNotifier(nil)
		if err != nil {
			log.Error().Err(err).Msg("Failed to get notifier")
			return
		}
		notifier.BuildStatusChange(build)
	}(*build)

	return nil
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

func (q *BuildQueries) tryGetBuildStatus(tx *sqlx.Tx, ctx context.Context, id string, complete bool) (string, error) {
	selectSnapshotsQuery := `SELECT status FROM snapshot WHERE build_id = $1 FOR UPDATE`

	build, err := q.GetBuildForUpdate(tx, ctx, id)

	if err != nil {
		return "", err
	}

	if models.IsBuildPreProcessing(build.Status) && !complete {
		// Build isn't processing, so we don't need to do anything
		return build.Status, nil
	}

	if build.Status == models.BUILD_STATUS_QUEUED_UPLOADING {
		return models.BUILD_STATUS_QUEUED_PROCESSING, nil
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
		if status == models.SNAPSHOT_STATUS_PROCESSING || status == models.SNAPSHOT_STATUS_QUEUED {
			// We can assume queued snapshots here are about to be processed
			worstStatus = models.BUILD_STATUS_PROCESSING
		} else if status == models.SNAPSHOT_STATUS_UNREVIEWED && worstStatus != models.BUILD_STATUS_PROCESSING {
			worstStatus = models.BUILD_STATUS_UNREVIEWED
		}
	}

	return worstStatus, nil
}

func (q *BuildQueries) CheckAndUpdateStatusAccordingly(id string) error {

	updateBuildQuery := `UPDATE build SET status = $1, updated_at = $2 WHERE id = $3`

	ctx := context.Background()

	tx, err := q.BeginTxx(ctx, nil)

	if err != nil {
		return err
	}

	// nolint:errcheck
	defer tx.Rollback()

	build, err := q.GetBuildForUpdate(tx, ctx, id)
	if err != nil {
		return err
	}

	status, err := q.tryGetBuildStatus(tx, ctx, id, false)

	if err != nil {
		return err
	}

	if models.IsBuildProcessing(status) {
		// Build is still processing, so we don't need to do anything
		return nil
	}

	// This build is no longer processing so we can check if there are any queued builds that we can start processing
	go func(q *BuildQueries, build models.Build) {
		if err := q.CheckAndProcessQueuedBuilds(build.ID); err != nil {
			log.Error().Err(err).Msgf("Failed to check and process queued builds for build %s", build.ID)
		}
	}(q, build)

	if status != build.Status {

		build.Status = status
		build.UpdatedAt = utils.CurrentTime()

		if _, err = tx.ExecContext(ctx, updateBuildQuery, build.Status, build.UpdatedAt, build.ID); err != nil {
			return err
		}

		if err := tx.Commit(); err != nil {
			return err
		}

		go func(build models.Build) {
			notifier, err := events.GetNotifier(nil)
			if err != nil {
				log.Error().Err(err).Msg("Failed to get notifier")
				return
			}
			notifier.BuildStatusChange(build)
		}(build)

		return nil
	}

	return tx.Rollback()
}

func (q *BuildQueries) CheckAndProcessQueuedBuilds(build_id string) error {
	builds := []models.Build{}

	query := `SELECT * FROM build WHERE (target_parent_id = $1 OR target_build_id = $1) AND (status = $2 OR status = $3) FOR UPDATE`

	ctx := context.Background()

	tx, err := q.BeginTxx(ctx, nil)

	if err != nil {
		return err
	}

	// nolint:errcheck
	defer tx.Rollback()

	if err := tx.SelectContext(ctx, &builds, query, build_id, models.BUILD_STATUS_QUEUED_PROCESSING, models.BUILD_STATUS_QUEUED_UPLOADING); err != nil {
		return err
	}

	snapshots := [][]models.Snapshot{}

	for i, build := range builds {
		snaps, err := q.StartProcessingQueuedBuild(tx, ctx, &build)
		if err != nil {
			log.Error().Err(err).Msgf("Failed to start processing queued build %s", build.ID)
		}
		builds[i] = build

		snapshots = append(snapshots, snaps)

	}

	if err := tx.Commit(); err != nil {
		return err
	}

	b, err := broker.GetBroker()

	if err != nil {
		return err
	}

	for i, build := range builds {
		go func(b *broker.Queues, build models.Build, snaps []models.Snapshot) {
			notifier, err := events.GetNotifier(b)
			if err != nil {
				log.Error().Err(err).Msg("Failed to get notifier")
				return
			}
			notifier.BuildStatusChange(build)

			// We need to queue the snapshots to be ingested
			if len(snapshots) > 0 {
				if err := b.QueueSnapshotsIngest(snaps); err != nil {
					log.Error().Err(err).Msgf("Failed to queue snapshots for build %s", build.ID)
				}
			}
		}(b, build, snapshots[i])

	}

	return nil
}

// TODO - We should attach errors to the build & snapshots
func (q *BuildQueries) StartProcessingQueuedBuild(tx *sqlx.Tx, ctx context.Context, build *models.Build) ([]models.Snapshot, error) {

	selectSnapshotsQuery := `SELECT * FROM snapshot WHERE build_id = $1 AND status = $2 FOR UPDATE`
	updateSnapshotsQuery := `UPDATE snapshot SET status = $1, updated_at = $2 WHERE id = $3`
	updateBuildQuery := `UPDATE build SET status = $1, updated_at = $2 WHERE id = $3`

	if build.Status != models.BUILD_STATUS_QUEUED_PROCESSING && build.Status != models.BUILD_STATUS_QUEUED_UPLOADING {
		// Build is not queued for processing, so we don't need to do anything
		return nil, nil
	}

	build.UpdatedAt = utils.CurrentTime()

	snapshots := []models.Snapshot{}

	if err := tx.SelectContext(ctx, &snapshots, selectSnapshotsQuery, build.ID, models.SNAPSHOT_STATUS_QUEUED); err != nil {
		return nil, err
	}

	if build.Status == models.BUILD_STATUS_QUEUED_UPLOADING {
		// Build is queued for uploading, so we can start processing already queued snapshots
		build.Status = models.BUILD_STATUS_UPLOADING
	} else {
		buildStatus, err := q.tryGetBuildStatus(tx, ctx, build.ID, false)

		if err != nil {
			return nil, err
		}

		build.Status = buildStatus
	}

	if _, err := tx.ExecContext(ctx, updateBuildQuery, build.Status, build.UpdatedAt, build.ID); err != nil {
		return nil, err
	}

	for _, snapshot := range snapshots {
		snapshot.Status = models.SNAPSHOT_STATUS_PROCESSING
		snapshot.UpdatedAt = utils.CurrentTime()

		if _, err := tx.ExecContext(ctx, updateSnapshotsQuery, snapshot.Status, snapshot.UpdatedAt, snapshot.ID); err != nil {
			return nil, err
		}

	}

	log.Debug().Msgf("Starting processing for build %v", build)
	log.Debug().Msgf("Starting processing for snapshots %v", snapshots)

	return snapshots, nil
}

func (q *BuildQueries) CompleteBuild(id string) (models.Build, error) {
	updateBuildQuery := `UPDATE build SET status = $1, updated_at = $2 WHERE id = $3`

	ctx := context.Background()

	tx, err := q.BeginTxx(ctx, nil)

	if err != nil {
		return models.Build{}, err
	}

	// nolint:errcheck
	defer tx.Rollback()

	build, err := q.GetBuildForUpdate(tx, ctx, id)

	if err != nil {
		return build, err
	}

	log.Debug().Msgf("Completing build %v", build)

	if !models.IsBuildPreProcessing(build.Status) {
		// Build has already been marked as complete
		return build, echo.NewHTTPError(http.StatusBadRequest, "build has already been marked as complete")
	}

	status, err := q.tryGetBuildStatus(tx, ctx, id, true)

	if err != nil {
		return build, err
	}

	if status != build.Status {
		build.Status = status

		if _, err = tx.ExecContext(ctx, updateBuildQuery, status, utils.CurrentTime(), build.ID); err != nil {
			return build, err
		}

		if err = tx.Commit(); err != nil {
			return build, err
		}

		go func(build models.Build) {
			notifier, err := events.GetNotifier(nil)
			if err != nil {
				log.Error().Err(err).Msg("Failed to get notifier")
				return
			}
			notifier.BuildStatusChange(build)
		}(build)

		if models.IsBuildComplete(build.Status) {
			go func(build models.Build, q *BuildQueries) {
				if err := q.CheckAndProcessQueuedBuilds(build.ID); err != nil {
					log.Error().Err(err).Msgf("Failed to check and process queued builds for build %s", build.ID)
				}
			}(build, q)
		}

		return build, nil
	}

	return build, tx.Commit()
}
