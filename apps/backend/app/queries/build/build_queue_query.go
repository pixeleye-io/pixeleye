package build_queries

import (
	"context"

	"github.com/pixeleye-io/pixeleye/app/events"
	"github.com/pixeleye-io/pixeleye/app/models"
	snapshot_queries "github.com/pixeleye-io/pixeleye/app/queries/snapshot"
	"github.com/pixeleye-io/pixeleye/platform/broker"
	"github.com/rs/zerolog/log"
)

func (tx *BuildQueriesTx) GetDependantQueuedBuildsForUpdate(ctx context.Context, build_id string) ([]models.Build, error) {
	builds := []models.Build{}

	query := `SELECT * FROM build WHERE (target_build_id = $1) AND (status = $2 OR status = $3) FOR UPDATE`

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

func (q *BuildQueries) CheckAndProcessQueuedBuild(ctx context.Context, build models.Build) error {

	if models.IsBuildPostProcessing(build.Status) {
		return nil
	}

	// Lets check if all the builds dependencies are done
	if fin, err := q.AreBuildDependenciesPostProcessing(ctx, build); err != nil {
		return err
	} else if !fin {
		return nil
	}

	// Make sure we have correct parents and targets. If they have failed/aborted we should use their parents/targets
	if err := q.SquashDependencies(ctx, build.ID); err != nil {
		return err
	}

	b, err := broker.GetBroker()
	if err != nil {
		return err
	}

	notifier, err := events.GetNotifier(b)
	if err != nil {
		return err
	}

	tx, err := NewBuildTx(q.DB, ctx)
	if err != nil {
		return err
	}

	// nolint:errcheck
	defer tx.Rollback()

	// Our build is still uploading so we should wait for it to finish
	if models.IsBuildPreProcessing(build.Status) {
		// TODO - we should still queue the snapshots for ingestion

		build.Status = models.BUILD_STATUS_UPLOADING
		if err := tx.UpdateBuildStatus(ctx, &build); err != nil {
			log.Error().Err(err).Msgf("Failed to update build %s", build.ID)
			return err
		}

		notifier.BuildStatusChange(build)

		return tx.Commit()
	}

	// We are needing to process the build

	build.Status = models.BUILD_STATUS_PROCESSING

	if err := tx.UpdateBuildStatus(ctx, &build); err != nil {
		log.Error().Err(err).Msgf("Failed to update build %s", build.ID)
		return err
	}

	// Get all queued snaps and start processing them

	snaps, err := tx.GetQueuedSnapshots(ctx, &build)
	if err != nil {
		log.Error().Err(err).Msgf("Failed to get queued snapshots for build %s", build.ID)
		return err
	}

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

	if err := tx.Commit(); err != nil {
		return err
	}

	// Send our snaps to the rabbitmq queue and alert any listeners that our build status has changed
	go func(build models.Build, snaps []models.Snapshot, notifier *events.Notifier, broker *broker.Queues) {

		notifier.BuildStatusChange(build)

		// We need to queue the snapshots to be ingested
		if len(snaps) > 0 {
			if err := b.QueueSnapshotsIngest(snaps); err != nil {
				log.Error().Err(err).Msgf("Failed to queue snapshots for build %s", build.ID)
			}
		}
	}(build, snaps, notifier, b)

	return nil
}
