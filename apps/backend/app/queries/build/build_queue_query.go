package build_queries

import (
	"context"

	"github.com/pixeleye-io/pixeleye/app/models"
	snapshot_queries "github.com/pixeleye-io/pixeleye/app/queries/snapshot"
	"github.com/rs/zerolog/log"
)

func (tx *BuildQueriesTx) GetQueuedSnapshots(ctx context.Context, build *models.Build) ([]models.Snapshot, error) {
	snapshots := []models.Snapshot{}

	query := `SELECT * FROM snapshot WHERE build_id = $1 AND status = $2 FOR UPDATE`

	if err := tx.SelectContext(ctx, &snapshots, query, build.ID, models.SNAPSHOT_STATUS_QUEUED); err != nil {
		return snapshots, err
	}

	return snapshots, nil

}

func (tx *BuildQueriesTx) CheckAndProcessQueuedSnapshots(ctx context.Context, build models.Build) ([]models.Snapshot, error) {

	snaps, err := tx.GetQueuedSnapshots(ctx, &build)
	if err != nil {
		log.Error().Err(err).Msgf("Failed to get queued snapshots for build %s", build.ID)
		return nil, err
	}

	if len(snaps) == 0 {
		// We have no snapshots to process so we can just finish
		return []models.Snapshot{}, nil
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
		log.Error().Err(err).Msgf("Failed to update snapshot status for build %s", build.ID)
		return nil, err
	}

	return snaps, nil
}
