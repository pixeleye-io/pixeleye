package build_queries

import (
	"context"
	"database/sql"
	"fmt"

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

	parentBuild, err := q.GetBuild(ctx, build.TargetParentID)
	if err != nil && err != sql.ErrNoRows {
		return err
	}

	if !models.IsBuildPostProcessing(parentBuild.Status) {
		return nil
	}

	targetBuild, err := q.GetBuild(ctx, build.TargetBuildID)
	if err != nil && err != sql.ErrNoRows {
		return err
	}

	if !models.IsBuildPostProcessing(targetBuild.Status) {
		return nil
	}

	updateBuild := false

	if parentBuild.Status == models.BUILD_STATUS_FAILED || parentBuild.Status == models.BUILD_STATUS_ABORTED {
		build.TargetParentID = parentBuild.TargetParentID
		updateBuild = true
	}

	if targetBuild.Status == models.BUILD_STATUS_FAILED || targetBuild.Status == models.BUILD_STATUS_ABORTED {
		build.TargetBuildID = targetBuild.TargetBuildID
		updateBuild = true
	}

	tx, err := NewBuildTx(q.DB, ctx)
	if err != nil {
		return err
	}

	if models.IsBuildPreProcessing(build.Status) {
		log.Debug().Msgf("Build %s is still pre-processing", build.ID)

		// TODO - we should still queue the snapshots for ingestion

		build.Status = models.BUILD_STATUS_UPLOADING
		if err := tx.UpdateBuildStatusAndParent(ctx, &build); err != nil {
			log.Error().Err(err).Msgf("Failed to update build %s", build.ID)
		}

		return tx.Commit()
	}

	snaps, err := tx.GetQueuedSnapshots(ctx, &build)
	if err != nil {
		log.Err(err).Msgf("Failed to get queued snapshots for build %s", build.ID)
		if updateBuild {
			if err := tx.UpdateBuildStatusAndParent(ctx, &build); err != nil {
				return err
			}
			return tx.Commit()
		}
		return err
	}

	build.Status = models.BUILD_STATUS_PROCESSING
	if err := tx.UpdateBuildStatusAndParent(ctx, &build); err != nil {
		log.Error().Err(err).Msgf("Failed to update build %s", build.ID)
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

	go func(build models.Build, snaps []models.Snapshot) {

		b, err := broker.GetBroker()
		if err != nil {
			log.Error().Err(err).Msg("Failed to get broker")
			return
		}

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
	}(build, snaps)

	return nil
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

	for _, build := range builds {
		err = q.CheckAndProcessQueuedBuild(ctx, build)
		if err != nil {
			log.Error().Err(err).Msgf("Failed to process queued build %s", build.ID)
		}
	}

	return err
}
