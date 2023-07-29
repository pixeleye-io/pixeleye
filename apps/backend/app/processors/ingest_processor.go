package processors

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/rs/zerolog/log"

	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/platform/database"
)

// TODO - make sure I'm setting snapshot to failed & storing error if it does fail

// 1) Check in build history for an approved snapshot, get first
// 2) If the approved snapshot is the same as the baseline, then we can approve this snapshot
// 3) If the approved snapshot is different, then we need to generate a diff and set the status to unreviewed
func processSnapshot(snapshot models.Snapshot, baselineSnapshot models.Snapshot, db *database.Queries) error {

	lastApprovedSnapshot, err := db.GetLastApprovedInHistory(snapshot.SnapId)

	if err != sql.ErrNoRows {
		if err != nil {
			return err
		}

		if lastApprovedSnapshot.SnapId == baselineSnapshot.SnapId {
			db.SetSnapshotStatus(snapshot.SnapId, models.SNAPSHOT_STATUS_APPROVED)
			return nil
		}
	}

	// TODO - process the image changes

	return db.SetSnapshotStatus(snapshot.SnapId, models.SNAPSHOT_STATUS_UNREVIEWED)
}

// group the snapshots into new, removed, changed and unchanged
// We also pair the snapshots with their baselines if they exist
func groupSnapshots(snapshots []models.Snapshot, baselines []models.Snapshot) (newSnapshots []string, removedSnapshots []string, unchangedSnapshots []string, changedSnapshots [][2]models.Snapshot) {
	newSnapshots = []string{}
	removedSnapshots = []string{}
	unchangedSnapshots = []string{}
	changedSnapshots = [][2]models.Snapshot{}

	for _, snapshot := range snapshots {
		found := false
		for _, baseline := range baselines {
			if models.CompareSnaps(snapshot, baseline) {
				found = true

				if snapshot.SnapId == baseline.SnapId {
					unchangedSnapshots = append(unchangedSnapshots, snapshot.ID)
				} else {
					changedSnapshots = append(changedSnapshots, [2]models.Snapshot{snapshot, baseline})
				}
			}
		}

		if !found {
			newSnapshots = append(newSnapshots, snapshot.ID)
		}

	}

	// Now we need to find the snapshots that have been removed
	for _, baseline := range baselines {
		found := false
		for _, snapshot := range snapshots {
			if models.CompareSnaps(snapshot, baseline) {
				found = true
			}
		}

		if !found {
			removedSnapshots = append(removedSnapshots, baseline.ID)
		}
	}

	return newSnapshots, removedSnapshots, unchangedSnapshots, changedSnapshots
}

func compareBuilds(snapshots []models.Snapshot, baselines []models.Snapshot, build models.Build, db *database.Queries) error {

	newSnapshots, removedSnapshots, unchangedSnapshots, changedSnapshots := groupSnapshots(snapshots, baselines)

	// We can go ahead and mark the new snapshots as orphaned
	err := db.SetSnapshotsStatus(newSnapshots, models.SNAPSHOT_STATUS_ORPHANED)

	if err != nil {
		log.Error().Err(err).Str("Snapshots", strings.Join(newSnapshots, ", ")).Str("BuildID", build.ID).Msg("Failed to set snapshots status to orphaned")
		// We don't want to return this error because we still want to process the remaining snapshots
	}

	// We can go ahead and mark the removed snapshots as removed
	build.DeletedSnapshotIDs = append(build.DeletedSnapshotIDs, removedSnapshots...)
	err = db.UpdateBuild(&build)

	if err != nil {
		log.Error().Err(err).Str("Snapshots", strings.Join(removedSnapshots, ", ")).Str("BuildID", build.ID).Msg("Failed to update build with removed snapshots")
		// We don't want to return this error because we still want to process the remaining snapshots
	}

	// We can go ahead and mark the unchanged snapshots as unchanged
	err = db.SetSnapshotsStatus(unchangedSnapshots, models.SNAPSHOT_STATUS_UNCHANGED)

	if err != nil {
		log.Error().Err(err).Str("Snapshots", strings.Join(unchangedSnapshots, ", ")).Str("BuildID", build.ID).Msg("Failed to set snapshots status to unchanged")
		// We don't want to return this error because we still want to process the remaining snapshots
	}

	for _, snap := range changedSnapshots {
		err := processSnapshot(snap[0], snap[1], db)

		if err != nil {
			log.Error().Err(err).Str("SnapshotID", snap[0].SnapId).Msg("Failed to process snapshot")

			err = db.SetSnapshotStatus(snap[0].SnapId, models.SNAPSHOT_STATUS_FAILED)
			if err != nil {
				log.Error().Err(err).Str("SnapshotID", snap[0].SnapId).Msg("Failed to set snapshot status to failed")
			}
		}
	}

	return nil

}

// Steps:
// 1. Get snapshot & (build parent) from DB
// 2. Figure out which snapshots to compare it to
// 2.1. If build parent is nil, then there is nothing to compare it to - mark snapshot as new
// 2.2. If build parent is not nil, then compare it to the snapshots in the build parent
// 3 Figure out if snapshot has been previously reviewed in relation to the build parent snapshot
// 3.1 If it has been reviewed, then mark it as reviewed
// 3.2 If it has not been reviewed, then mark it as unreviewed

// We assume all the snapshots belong to the same build
func IngestSnapshots(snapshotIDs []string) error {

	if len(snapshotIDs) == 0 {
		return fmt.Errorf("no snapshot IDs provided")
	}

	db, err := database.OpenDBConnection()

	if err != nil {
		return err
	}

	snapshots, err := db.GetSnapshots(snapshotIDs)

	if err != nil {
		return err
	}

	if len(snapshots) != len(snapshotIDs) {
		log.Warn().Int("Expected", len(snapshotIDs)).Int("Actual", len(snapshots)).Msg("Not all snapshots were found when ingesting snapshots")
	}

	if len(snapshots) == 0 {
		return fmt.Errorf("no snapshots found for snapshot IDs: %s", strings.Join(snapshotIDs, ", "))
	}

	build, err := db.GetBuild(snapshots[0].BuildID)

	if err != nil {
		return err
	}

	if build.ParentBuildID == "" {
		err = db.SetSnapshotsStatus(snapshotIDs, models.SNAPSHOT_STATUS_ORPHANED)
		if err != nil {
			return err
		}
	} else {
		parentBuild, err := db.GetBuild(build.ParentBuildID)

		if err != nil {
			return err
		}

		parentBuildSnapshots, err := db.GetSnapshotsByBuild(parentBuild.ID)

		if err != nil {
			return err
		}

		err = compareBuilds(snapshots, parentBuildSnapshots, build, db)

	}

	// TODO - check if we can mark build as finished processing
	return nil
}
