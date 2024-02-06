package build_queries

import (
	"context"
	"slices"

	"github.com/pixeleye-io/pixeleye/app/events"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/platform/broker"
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

//

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
		return models.BUILD_STATUS_PROCESSING
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

func (q *BuildQueries) ProcessBuildDependents(ctx context.Context, build models.Build) error {

	dependents, err := q.GetBuildDependents(ctx, build)
	if err != nil {
		return err
	}

	for _, dependent := range dependents {
		if err := q.CheckAndProcessQueuedBuild(ctx, dependent); err != nil {
			log.Debug().Err(err).Msgf("Failed to process queued builds for build %s", dependent.ID)
		}
	}

	return nil
}

func (q *BuildQueries) AbortBuild(ctx context.Context, build models.Build) error {

	// NOTE: We don't worry about updating the children here since we take care of that when we process the queued builds

	query := `UPDATE build SET status = $1 WHERE id = $2`

	if _, err := q.ExecContext(ctx, query, models.BUILD_STATUS_ABORTED, build.ID); err != nil {
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

	return q.ProcessBuildDependents(ctx, build)
}

func (q *BuildQueries) FailBuild(ctx context.Context, build models.Build) error {

	// NOTE: We don't worry about updating the children here since we take care of that when we process the queued builds

	query := `UPDATE build SET status = $1 WHERE id = $2`

	if _, err := q.ExecContext(ctx, query, models.BUILD_STATUS_FAILED, build.ID); err != nil {
		return err
	}

	build.Status = models.BUILD_STATUS_FAILED

	go func(build models.Build) {
		notifier, err := events.GetNotifier(nil)
		if err != nil {
			log.Error().Err(err).Msg("Failed to get notifier")
			return
		}
		notifier.BuildStatusChange(build)
	}(build)

	return q.ProcessBuildDependents(ctx, build)
}

func (q *BuildQueries) GetBuildDependents(ctx context.Context, build models.Build) ([]models.Build, error) {

	childrenBuilds, err := q.GetBuildChildren(ctx, build.ID)
	if err != nil {
		return nil, err
	}

	targeterBuilds, err := q.GetBuildTargeters(ctx, build.ID)
	if err != nil {
		return nil, err
	}

	return append(childrenBuilds, targeterBuilds...), nil
}

func (q *BuildQueries) GetBuildDependencies(ctx context.Context, build models.Build) ([]models.Build, error) {

	parentBuilds, err := q.GetBuildParents(ctx, build.ID, nil)
	if err != nil {
		return nil, err
	}

	targetBuilds, err := q.GetBuildTargets(ctx, build.ID, nil)
	if err != nil {
		return nil, err
	}

	return append(parentBuilds, targetBuilds...), nil
}

func (q *BuildQueries) AreBuildDependenciesPostProcessing(ctx context.Context, build models.Build) (bool, error) {

	builds, err := q.GetBuildDependencies(ctx, build)
	if err != nil {
		return false, err
	}

	for _, build := range builds {
		if !models.IsBuildPostProcessing(build.Status) {
			return false, nil
		}
	}

	return true, nil
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

	db := BuildQueries{tx.DB}

	targetBuilds, err := db.GetBuildTargets(ctx, build.ID, nil)
	if err != nil {
		return "", err
	}

	if len(targetBuilds) == 0 {
		return models.BUILD_STATUS_ORPHANED, nil
	}

	status := getBuildStatusFromSnapshotStatuses(snapshotStatus)

	if slices.Contains([]string{models.BUILD_STATUS_PROCESSING, models.BUILD_STATUS_UPLOADING}, status) {
		depsProcessing, err := db.AreBuildDependenciesPostProcessing(ctx, build)
		if err != nil {
			return "", err
		}

		if !depsProcessing {
			if status == models.BUILD_STATUS_PROCESSING {
				return models.BUILD_STATUS_QUEUED_PROCESSING, nil
			} else if status == models.BUILD_STATUS_UPLOADING {
				return models.BUILD_STATUS_QUEUED_UPLOADING, nil
			}
		}
	}

	return status, nil
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

		var snaps []models.Snapshot
		if build.Status == models.BUILD_STATUS_PROCESSING {
			// Get all queued snaps and start processing them
			snaps, err = tx.CheckAndProcessQueuedSnapshots(ctx, build)
			if err != nil {
				log.Error().Err(err).Msgf("Failed to check and process queued snapshots for build %s", build.ID)
				return &build, err
			}
		}

		if err = tx.Commit(); err != nil {
			return &build, err
		}

		go func(build models.Build, snaps []models.Snapshot) {
			broker, err := broker.GetBroker()
			if err != nil {
				log.Error().Err(err).Msg("Failed to get broker")
				return
			}

			notifier, err := events.GetNotifier(broker)
			if err != nil {
				log.Error().Err(err).Msg("Failed to get notifier")
				return
			}

			notifier.BuildStatusChange(build)
			if len(snaps) > 0 {
				// We need to queue the snapshots to be ingested
				if err := broker.QueueSnapshotsIngest(snaps); err != nil {
					log.Error().Err(err).Msgf("Failed to queue snapshots for build %s", build.ID)
				}
			}
		}(build, snaps)
	}

	if models.IsBuildPostProcessing(build.Status) {
		if err := q.ProcessBuildDependents(ctx, build); err != nil {
			return &build, err
		}
	}

	return &build, nil
}
