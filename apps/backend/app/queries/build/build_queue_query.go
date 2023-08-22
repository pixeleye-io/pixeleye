package build_queries

import (
	"context"
	"fmt"

	"github.com/pixeleye-io/pixeleye/app/events"
	"github.com/pixeleye-io/pixeleye/app/models"
	snapshot_queries "github.com/pixeleye-io/pixeleye/app/queries/snapshot"
	"github.com/pixeleye-io/pixeleye/platform/broker"
	"github.com/rs/zerolog/log"
)

func (tx *BuildQueriesTx) GetDependantQueuedBuildsForUpdate(ctx context.Context, build_id string) ([]models.Build, error) {
	builds := []models.Build{}

	query := `SELECT * FROM build WHERE (target_parent_id = $1 OR target_build_id = $1) AND (status = $2 OR status = $3) FOR UPDATE`

	if err := tx.SelectContext(ctx, &builds, query, build_id, models.BUILD_STATUS_QUEUED_PROCESSING, models.BUILD_STATUS_QUEUED_UPLOADING); err != nil {
		return builds, err
	}

	return builds, nil
}

func (tx *BuildQueriesTx) GetQueuedSnapshots(ctx context.Context, build *models.Build) ([]models.Snapshot, error) {
	snapshots := []models.Snapshot{}

	query := `SELECT * FROM snapshot WHERE build_id = $1 AND status = $2 FOR UPDATE`

	if err := tx.SelectContext(ctx, &snapshots, query, build.ID, models.SNAPSHOT_STATUS_QUEUED); err != nil {
		return snapshots, err
	}

	return snapshots, nil

}

func (q *BuildQueries) CheckAndProcessQueuedBuilds(ctx context.Context, parentBuild models.Build) error {

	if !models.IsBuildPostProcessing(parentBuild.Status) {
		return fmt.Errorf("parent build %s is not in post processing", parentBuild.ID)
	}

	tx, err := NewBuildTx(q.DB, ctx)

	if err != nil {
		return err
	}

	// nolint:errcheck
	defer tx.Rollback()

	builds, err := tx.GetDependantQueuedBuildsForUpdate(ctx, parentBuild.ID)

	if err != nil {
		return err
	}

	log.Debug().Msgf("Found %v queued builds for parent: %s", builds, parentBuild.ID)

	snapshots := [][]models.Snapshot{}

	for i, build := range builds {
		snaps, err := tx.GetQueuedSnapshots(ctx, &build)
		if err != nil {
			log.Error().Err(err).Msgf("Failed to get queued snapshots for build %s", build.ID)
		} else {

			build.Status = models.BUILD_STATUS_PROCESSING
			if err := tx.UpdateBuild(ctx, &build); err != nil {
				log.Error().Err(err).Msgf("Failed to update build %s", build.ID)
			}
			builds[i] = build

			snapIDs := make([]string, len(snaps))
			for i, snap := range snaps {
				snap.Status = models.SNAPSHOT_STATUS_PROCESSING
				snapIDs[i] = snap.ID
			}

			stx := snapshot_queries.SnapshotQueriesTx{
				Tx: tx.Tx,
			}

			if err := stx.BatchUpdateSnapshotStatus(ctx, snapIDs, models.SNAPSHOT_STATUS_PROCESSING); err != nil {
				log.Error().Err(err).Msgf("Failed to update snapshots for build %s", build.ID)
			}

			snapshots = append(snapshots, snaps)
		}
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
			if len(snaps) > 0 {
				if err := b.QueueSnapshotsIngest(snaps); err != nil {
					log.Error().Err(err).Msgf("Failed to queue snapshots for build %s", build.ID)
				}
			}
		}(b, build, snapshots[i])
	}

	return nil
}
