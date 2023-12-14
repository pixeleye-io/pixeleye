package build_queries

import (
	"context"

	"github.com/pixeleye-io/pixeleye/app/events"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/rs/zerolog/log"
)

// Snapshot status to order map
// nolint: gochecknoglobals
var snapshotStatusMap = map[string]int{
	models.SNAPSHOT_STATUS_FAILED:           0,
	models.SNAPSHOT_STATUS_QUEUED:           1,
	models.SNAPSHOT_STATUS_PROCESSING:       2,
	models.SNAPSHOT_STATUS_UNREVIEWED:       3,
	models.SNAPSHOT_STATUS_REJECTED:         4,
	models.SNAPSHOT_STATUS_APPROVED:         5,
	models.SNAPSHOT_STATUS_UNCHANGED:        6,
	models.SNAPSHOT_STATUS_MISSING_BASELINE: 7,
	models.SNAPSHOT_STATUS_ORPHANED:         8,
	"unknown":                               9,
}

// We assume that builds are past the preProcessing stage
func getBuildStatusFromSnapshotStatuses(statuses []string) string {
	worstStatus := "unknown"

	for _, status := range statuses {
		if snapshotStatusMap[status] < snapshotStatusMap[worstStatus] {
			worstStatus = status
		}
	}

	switch worstStatus {
	case models.SNAPSHOT_STATUS_FAILED:
		return models.BUILD_STATUS_FAILED
	case models.SNAPSHOT_STATUS_QUEUED:
		return models.BUILD_STATUS_QUEUED_PROCESSING
	case models.SNAPSHOT_STATUS_PROCESSING:
		return models.BUILD_STATUS_PROCESSING
	case models.SNAPSHOT_STATUS_UNREVIEWED:
		return models.BUILD_STATUS_UNREVIEWED
	case models.SNAPSHOT_STATUS_REJECTED:
		return models.BUILD_STATUS_REJECTED
	case models.SNAPSHOT_STATUS_APPROVED:
		return models.BUILD_STATUS_APPROVED
	case models.SNAPSHOT_STATUS_UNCHANGED:
		return models.BUILD_STATUS_UNCHANGED
	case models.SNAPSHOT_STATUS_MISSING_BASELINE:
		return models.BUILD_STATUS_UNCHANGED
	case models.SNAPSHOT_STATUS_ORPHANED:
		return models.BUILD_STATUS_ORPHANED
	default:
		return models.BUILD_STATUS_UNCHANGED
	}
}

func (q *BuildQueries) AbortBuild(ctx context.Context, build models.Build) error {

	query := `UPDATE build SET status = $1, target_parent_id = '', target_build_id = '' WHERE id = $2`
	updateChildrenBuildTargetsQuery := `UPDATE build SET target_build_id = $1 WHERE target_build_id = $2 RETURNING id, target_build_id, target_parent_id, status`
	updateChildrenParentTargetsQuery := `UPDATE build SET target_parent_id = $1 WHERE target_parent_id = $2 RETURNING id, target_build_id, target_parent_id, status`

	txx, err := q.DB.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}

	// nolint:errcheck
	defer txx.Rollback()

	if _, err := txx.ExecContext(ctx, query, models.BUILD_STATUS_ABORTED, build.ID); err != nil {
		return err
	}

	childBuilds := []models.Build{}

	// Since this build is aborted, we want to pass the target build id to the children
	rows, err := txx.QueryContext(ctx, updateChildrenBuildTargetsQuery, build.TargetBuildID, build.ID)
	if err != nil {
		return err
	}

	for rows.Next() {
		var childBuild models.Build
		if err := rows.Scan(&childBuild.ID, &childBuild.TargetBuildID, &childBuild.TargetParentID, &childBuild.Status); err != nil {
			return err
		}
		childBuilds = append(childBuilds, childBuild)
	}

	// Since this build is aborted, we want to pass the target parent id to the children
	rows, err = txx.QueryContext(ctx, updateChildrenParentTargetsQuery, build.TargetParentID, build.ID)
	if err != nil {
		return err
	}

	for rows.Next() {
		var childBuild models.Build
		if err := rows.Scan(&childBuild.ID, &childBuild.TargetParentID, &childBuild.TargetBuildID, &childBuild.Status); err != nil {
			return err
		}

		found := false
		for _, b := range childBuilds {
			if b.ID == childBuild.ID {
				found = true
				break
			}
		}

		if !found {
			childBuilds = append(childBuilds, childBuild)
		}
	}

	if err := txx.Commit(); err != nil {
		return err
	}

	build.Status = models.BUILD_STATUS_ABORTED

	go func(build models.Build) {
		notifier, err := events.GetNotifier(nil)
		if err != nil {
			log.Error().Err(err).Msg("Failed to get notifier")
			return
		}
		notifier.BuildStatusChange(build)
	}(build)

	for _, childBuild := range childBuilds {
		if err := q.CheckAndProcessQueuedBuild(ctx, childBuild); err != nil {
			log.Error().Err(err).Msgf("Failed to check and process queued builds for build %s", childBuild.ID)
		}
	}

	return nil
}

func (tx *BuildQueriesTx) CalculateBuildStatus(ctx context.Context, build models.Build) (string, error) {
	selectSnapshotsQuery := `SELECT status FROM snapshot WHERE build_id = $1 FOR UPDATE`

	if models.IsBuildPreProcessing(build.Status) || build.Status == models.BUILD_STATUS_FAILED || build.Status == models.BUILD_STATUS_ABORTED {
		return build.Status, nil
	}

	snapshotStatus := []string{}

	if err := tx.SelectContext(ctx, &snapshotStatus, selectSnapshotsQuery, build.ID); err != nil {
		return "", err
	}

	if build.TargetBuildID == "" && build.TargetParentID == "" {
		return models.BUILD_STATUS_ORPHANED, nil
	}

	return getBuildStatusFromSnapshotStatuses(snapshotStatus), nil
}

func (q *BuildQueries) CheckAndUpdateStatusAccordingly(ctx context.Context, buildID string) (*models.Build, error) {

	log.Debug().Msgf("Checking build status for build %s", buildID)

	tx, err := NewBuildTx(q.DB, ctx)

	if err != nil {
		return nil, err
	}

	// nolint:errcheck
	defer tx.Rollback()

	build, err := tx.GetBuildForUpdate(ctx, buildID)
	if err != nil {
		return &build, err
	}

	if models.IsBuildPreProcessing(build.Status) {
		log.Debug().Msgf("Build %s is still pre-processing", buildID)
		return &build, tx.Commit()
	}

	status, err := tx.CalculateBuildStatus(ctx, build)

	if err != nil {
		return &build, err
	}

	if status == build.Status {
		log.Debug().Msgf("Build %s status is still %s", buildID, status)
		if err = tx.Commit(); err != nil {
			return &build, err
		}
	} else {

		build.Status = status

		log.Debug().Msgf("Updating build %s status to %s", buildID, status)

		if err := tx.UpdateBuild(ctx, &build); err != nil {
			return &build, err
		}

		if err = tx.Commit(); err != nil {
			return &build, err
		}

		go func(build models.Build) {
			notifier, err := events.GetNotifier(nil)
			if err != nil {
				log.Error().Err(err).Msg("Failed to get notifier")
				return
			}
			notifier.BuildStatusChange(build)
		}(build)
	}

	if models.IsBuildPostProcessing(build.Status) {
		if err := q.CheckAndProcessQueuedBuilds(ctx, build); err != nil {
			return &build, err
		}
	}

	return &build, nil
}
