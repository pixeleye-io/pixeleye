package processors

import (
	"bytes"
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"fmt"
	"os"
	"strings"

	"image"
	"image/png"
	_ "image/png"

	"github.com/rs/zerolog/log"

	"github.com/pixeleye-io/pixeleye/app/models"
	build_queries "github.com/pixeleye-io/pixeleye/app/queries/build"
	"github.com/pixeleye-io/pixeleye/pkg/imageDiff"
	"github.com/pixeleye-io/pixeleye/platform/database"
	"github.com/pixeleye-io/pixeleye/platform/storage"
)

// 1) Check in build history for an approved snapshot, get first
// 2) If the approved snapshot is the same as the baseline, then we can approve this snapshot
// 3) If the approved snapshot is different, then we need to generate a diff and set the status to unreviewed
func processSnapshot(snapshot models.Snapshot, baselineSnapshot models.Snapshot, db *database.Queries) error {

	snapshot.BaselineID = &baselineSnapshot.ID

	lastApprovedSnapshot, err := db.GetLastApprovedInHistory(snapshot.ID)

	if err != sql.ErrNoRows {
		if err != nil {
			return err
		}

		if lastApprovedSnapshot.SnapID == baselineSnapshot.SnapID {
			log.Debug().Str("SnapshotID", snapshot.ID).Msg("Snapshot is the same as the baseline, approving")
			snapshot.Status = models.SNAPSHOT_STATUS_APPROVED

			return db.UpdateSnapshot(snapshot)
		}
	}

	log.Debug().Str("SnapshotID", snapshot.ID).Msg("Snapshot is different to the baseline, generating diff")

	snapImg, err := db.GetSnapImage(snapshot.SnapID)

	if err != nil {
		return err
	}

	baseImg, err := db.GetSnapImage(baselineSnapshot.SnapID)

	if err != nil {
		return err
	}

	s3, err := storage.GetClient()

	if err != nil {
		return err
	}

	ch := make(chan []byte)

	for _, img := range []models.SnapImage{snapImg, baseImg} {
		go func(img models.SnapImage) {
			log.Debug().Str("SnapshotID", snapshot.ID).Str("ImageID", img.ID).Msg("Getting image from S3")
			path := fmt.Sprintf("snaps/%s/%s.png", img.ProjectID, img.Hash)

			imgBytes, err := s3.DownloadFile(os.Getenv("S3_BUCKET"), path)

			if err != nil {
				log.Error().Err(err).Str("SnapshotID", snapshot.ID).Str("ImageID", img.ID).Msg("Failed to get image from S3")
				ch <- []byte{}
				return
			}

			ch <- imgBytes
		}(img)
	}

	snapBytes := <-ch

	if len(snapBytes) == 0 {
		return fmt.Errorf("failed to get snapshot image from S3")
	}

	baseBytes := <-ch

	if len(baseBytes) == 0 {
		return fmt.Errorf("failed to get baseline image from S3")
	}

	snapshotImage, _, err := image.Decode(bytes.NewReader(snapBytes))
	if err != nil {
		log.Error().Err(err).Str("SnapshotID", snapshot.ID).Msg("Failed to decode snapshot image")
		return err
	}

	baselineImage, _, err := image.Decode(bytes.NewReader(baseBytes))
	if err != nil {
		log.Error().Err(err).Str("SnapshotID", snapshot.ID).Msg("Failed to decode baseline image")
		return err
	}

	diffImage := imageDiff.Diff(snapshotImage, baselineImage, &imageDiff.Options{Threshold: 0})

	if diffImage.Equal {
		log.Info().Str("SnapshotID", snapshot.ID).Msg("Diff image is equal to baseline after comparing pixels, setting to unchanged")
		snapshot.Status = models.SNAPSHOT_STATUS_UNCHANGED
		snapshot.BaselineID = nil
		return db.UpdateSnapshot(snapshot)
	}

	hasher := sha256.New()

	buff := new(bytes.Buffer)

	err = png.Encode(buff, diffImage.Image)

	if err != nil {
		log.Error().Err(err).Str("SnapshotID", snapshot.ID).Msg("Failed to encode diff image")
		return err
	}

	_, err = hasher.Write(buff.Bytes())

	if err != nil {
		log.Error().Err(err).Str("SnapshotID", snapshot.ID).Msg("Failed to hash diff image")
		return err
	}

	hash := hex.EncodeToString(hasher.Sum(nil))

	diffPath := fmt.Sprintf("diffs/%s/%s.png", snapImg.ProjectID, hash)

	exists, err := s3.FileExists(os.Getenv("S3_BUCKET"), diffPath)

	if err != nil {
		log.Error().Err(err).Str("SnapshotID", snapshot.ID).Msg("Failed to check if diff image exists in S3")
		return err
	}

	if !exists {
		if err = s3.UploadFile(os.Getenv("S3_BUCKET"), diffPath, buff.Bytes(), "image/png"); err != nil {
			log.Error().Err(err).Str("SnapshotID", snapshot.ID).Msg("Failed to upload diff image to S3")
			return err
		}
	}

	diffImg, err := db.GetDiffImage(hash, snapImg.ProjectID)

	if err != nil && err != sql.ErrNoRows {
		log.Error().Err(err).Str("SnapshotID", snapshot.ID).Msg("Failed to get diff image from DB")
		return err
	}

	if err == sql.ErrNoRows {
		diffImg = models.DiffImage{
			Hash:      hash,
			ProjectID: snapImg.ProjectID,
			Width:     diffImage.Image.Bounds().Dx(),
			Height:    diffImage.Image.Bounds().Dy(),
			Format:    "image/png",
		}

		if err = db.CreateDiffImage(&diffImg); err != nil {
			log.Error().Err(err).Str("SnapshotID", snapshot.ID).Msg("Failed to create diff image")
			return err
		}
	}

	snapshot.DiffID = &diffImg.ID
	snapshot.Status = models.SNAPSHOT_STATUS_UNREVIEWED

	return db.UpdateSnapshot(snapshot)
}

// group the snapshots into new, removed, changed and unchanged
// We also pair the snapshots with their baselines if they exist
func groupSnapshots(snapshots []models.Snapshot, baselines []models.Snapshot) (newSnapshots []string, removedSnapshots []string, unchangedSnapshots [][2]models.Snapshot, unreviewedSnapshots [][2]models.Snapshot, changedSnapshots [][2]models.Snapshot) {
	newSnapshots = []string{}
	removedSnapshots = []string{}
	unchangedSnapshots = [][2]models.Snapshot{}
	changedSnapshots = [][2]models.Snapshot{}
	unreviewedSnapshots = [][2]models.Snapshot{}

	for _, snapshot := range snapshots {
		found := false
		for _, baseline := range baselines {
			if models.CompareSnaps(snapshot, baseline) {
				found = true

				//  we can assume that the snapshots won't be an error as that should also be reflected by the build
				if snapshot.SnapID == baseline.SnapID {
					if baseline.Status == models.SNAPSHOT_STATUS_UNCHANGED || baseline.Status == models.SNAPSHOT_STATUS_APPROVED || baseline.Status == models.SNAPSHOT_STATUS_ORPHANED {
						unchangedSnapshots = append(unchangedSnapshots, [2]models.Snapshot{snapshot, baseline})
					} else {
						unreviewedSnapshots = append(unreviewedSnapshots, [2]models.Snapshot{snapshot, baseline})
					}
				} else {
					changedSnapshots = append(changedSnapshots, [2]models.Snapshot{snapshot, baseline})
				}
				break
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

	log.Debug().
		Str("New", strings.Join(newSnapshots, ", ")).
		Str("Removed", strings.Join(removedSnapshots, ", ")).
		Str("Unchanged", fmt.Sprintf("%v", unchangedSnapshots)).
		Str("Unreviewed", fmt.Sprintf("%v", unreviewedSnapshots)).
		Str("Changed", fmt.Sprintf("%v", changedSnapshots)).
		Msg("Grouped snapshots")

	return newSnapshots, removedSnapshots, unchangedSnapshots, unreviewedSnapshots, changedSnapshots
}

func compareBuilds(snapshots []models.Snapshot, baselines []models.Snapshot, build models.Build, db *database.Queries) error {

	newSnapshots, removedSnapshots, unchangedSnapshots, unreviewedSnapshots, changedSnapshots := groupSnapshots(snapshots, baselines)

	if len(newSnapshots) > 0 {
		// We can go ahead and mark the new snapshots as orphaned

		if err := db.SetSnapshotsStatus(newSnapshots, models.SNAPSHOT_STATUS_ORPHANED); err != nil {
			log.Error().Err(err).Str("Snapshots", strings.Join(newSnapshots, ", ")).Str("BuildID", build.ID).Msg("Failed to set snapshots status to orphaned")
			// We don't want to return this error because we still want to process the remaining snapshots
		}
	}

	if len(removedSnapshots) > 0 {

		ctx := context.TODO()

		tx, err := build_queries.NewBuildTx(db.BuildQueries.DB, ctx)

		if err != nil {
			log.Error().Err(err).Msg("Failed to create build tx")
		} else {

			defer tx.Rollback()

			latestBuild, err := tx.GetBuildForUpdate(ctx, build.ID)

			if err != nil {
				log.Error().Err(err).Msg("Failed to get build for update")
			} else {

				// We can go ahead and mark the removed snapshots as removed
				build.DeletedSnapshotIDs = append(latestBuild.DeletedSnapshotIDs, removedSnapshots...)

				if err := tx.UpdateBuild(ctx, &latestBuild); err != nil {
					log.Error().Err(err).Str("Snapshots", strings.Join(removedSnapshots, ", ")).Str("BuildID", build.ID).Msg("Failed to update build with removed snapshots")
					// We don't want to return this error because we still want to process the remaining snapshots
				}

				if err := tx.Commit(); err != nil {
					log.Error().Err(err).Msg("Failed to commit build tx")
				}

			}
		}

	}

	for _, snap := range unchangedSnapshots {
		snapshot := snap[0]
		snapshot.BaselineID = &snap[1].ID
		snapshot.Status = models.SNAPSHOT_STATUS_UNCHANGED

		if err := db.UpdateSnapshot(snapshot); err != nil {
			log.Error().Err(err).Msgf("Failed to set snapshots status to unchanged, SnapshotID %s", snapshot.ID)
			// We don't want to return this error because we still want to process the remaining snapshots
		}
	}

	for _, snap := range unreviewedSnapshots {
		snapshot := snap[0]
		snapshot.BaselineID = snap[1].BaselineID
		snapshot.Status = models.SNAPSHOT_STATUS_UNREVIEWED
		snapshot.DiffID = snap[1].DiffID

		if err := db.UpdateSnapshot(snapshot); err != nil {
			log.Error().Err(err).Msgf("Failed to set snapshots status to unreviewed, SnapshotID %s", snapshot.ID)
			// We don't want to return this error because we still want to process the remaining snapshots
		}
	}

	for _, snap := range changedSnapshots {
		err := processSnapshot(snap[0], snap[1], db)

		// TODO attach error to snapshot

		if err != nil {
			log.Error().Err(err).Str("SnapshotID", snap[0].ID).Msg("Failed to process snapshot")
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

	fmt.Printf("Ingesting snapshots: %s\n", strings.Join(snapshotIDs, ", "))

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

	log.Debug().Interface("Build", build).Msg("Build snapshots are from")

	if strings.TrimSpace(build.TargetBuildID) == "" {
		err = db.SetSnapshotsStatus(snapshotIDs, models.SNAPSHOT_STATUS_ORPHANED)
		log.Info().Str("BuildID", build.ID).Msg("Build has no parent build, marking all snapshots as orphaned")
		if err != nil {
			return err
		}
	} else {

		fmt.Printf("Build parent ID: %s\n", build.TargetBuildID)
		parentBuild, err := db.GetBuild(build.TargetBuildID)

		if err != nil {
			return err
		}

		parentBuildSnapshots, err := db.GetSnapshotsByBuild(parentBuild.ID)

		if err != nil {
			return err
		}

		err = compareBuilds(snapshots, parentBuildSnapshots, build, db)

		if err != nil {
			return err
		}

	}

	ctx := context.TODO()

	if err := db.CheckAndUpdateStatusAccordingly(ctx, build.ID); err != nil {
		return err
	}

	return nil
}
