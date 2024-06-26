package processors

import (
	"bytes"
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"os"
	"regexp"
	"strings"

	"image"
	"image/png"
	_ "image/png"

	"github.com/lib/pq"
	"github.com/rs/zerolog/log"

	"github.com/pixeleye-io/pixeleye/app/models"
	statuses_build "github.com/pixeleye-io/pixeleye/app/statuses/build"
	"github.com/pixeleye-io/pixeleye/app/stores"
	"github.com/pixeleye-io/pixeleye/pkg/imageDiff"
	"github.com/pixeleye-io/pixeleye/platform/database"
	"github.com/pixeleye-io/pixeleye/platform/storage"

	awshttp "github.com/aws/aws-sdk-go-v2/aws/transport/http"
)

func downloadSnapshotImages(ctx context.Context, s3 storage.IBucketClient, snapImg models.SnapImage, baseImg models.SnapImage) (snapBytes []byte, snapExists bool, baseBytes []byte, baseExists bool, err error) {

	type result struct {
		bytes  []byte
		exists bool
		order  int
	}

	resultCH := make(chan result, 2)

	for i, img := range []models.SnapImage{snapImg, baseImg} {
		go func(i int, img models.SnapImage) {
			path := stores.GetSnapPath(img.ProjectID, img.Hash)

			imgBytes, err := s3.DownloadFile(ctx, os.Getenv("S3_BUCKET"), path)
			if err != nil {
				exists := true
				var re *awshttp.ResponseError
				if errors.As(err, &re) {
					log.Debug().Msgf("Error code: %v", re.Response.StatusCode)
					if re.Response.StatusCode == 404 {
						exists = false
					}
				}
				resultCH <- result{
					bytes:  []byte{},
					exists: exists,
					order:  i,
				}
				return
			}

			resultCH <- result{
				bytes:  imgBytes,
				exists: true,
				order:  i,
			}
		}(i, img)
	}

	for i := 0; i < 2; i++ {
		temp := <-resultCH
		if temp.order == 0 {
			snapBytes = temp.bytes
			snapExists = temp.exists
		} else {
			baseBytes = temp.bytes
			baseExists = temp.exists
		}
	}

	if len(snapBytes) == 0 {
		return snapBytes, snapExists, baseBytes, baseExists, fmt.Errorf("failed to get snapshot image from S3")
	}

	if len(baseBytes) == 0 {
		return snapBytes, snapExists, baseBytes, baseExists, fmt.Errorf("failed to get baseline image from S3")
	}

	return snapBytes, snapExists, baseBytes, baseExists, nil
}

func generateBytesHash(imgBytes []byte) (string, error) {
	hasher := sha256.New()

	_, err := hasher.Write(imgBytes)

	if err != nil {
		return "", err
	}

	return hex.EncodeToString(hasher.Sum(nil)), nil
}

// 1) Check in build history for an approved snapshot, get first
// 2) If the approved snapshot is the same as the baseline, then we can approve this snapshot
// 3) If the approved snapshot is different, then we need to generate a diff and set the status to unreviewed
func processSnapshot(ctx context.Context, project models.Project, build models.Build, snapshot models.Snapshot, baselineSnapshot models.Snapshot, db *database.Queries) error {

	snapshot.BaselineID = &baselineSnapshot.ID

	lastApprovedSnapshot, err := db.GetLastApprovedInHistory(snapshot.ID)
	if err != nil && err != sql.ErrNoRows {
		return err
	}

	log.Debug().Str("SnapshotID", snapshot.ID).Interface("LastApprovedSnapshot", lastApprovedSnapshot).Msg("Last approved snapshot")

	if err != sql.ErrNoRows {
		if lastApprovedSnapshot.SnapID == snapshot.SnapID {

			log.Debug().Str("SnapshotID", snapshot.ID).Msg("Snapshot is the same as the last approved snapshot, approving")
			snapshot.Status = models.SNAPSHOT_STATUS_UNCHANGED
			snapshot.BaselineID = &lastApprovedSnapshot.ID

			return db.UpdateSnapshot(snapshot)
		}
	}

	log.Debug().Str("SnapshotID", snapshot.ID).Msg("Snapshot is different to the baseline, generating diff")

	snapImages, err := db.GetSnapImages(snapshot.SnapID, baselineSnapshot.SnapID)
	if err != nil {
		return err
	}

	var snapImg models.SnapImage
	var baseImg models.SnapImage
	for _, img := range snapImages {
		if img.ID == snapshot.SnapID {
			snapImg = img
		} else {
			baseImg = img
		}
	}

	s3, err := storage.GetClient()
	if err != nil {
		return err
	}

	snapBytes, snapExists, baseBytes, baseExists, err := downloadSnapshotImages(ctx, s3, snapImg, baseImg)

	log.Debug().Msgf("Snapshot exists: %v, Baseline exists: %v", snapExists, baseExists)

	if err != nil {
		if !snapExists {
			if err := db.SetSnapImageExists(ctx, snapImg.ID, false); err != nil {
				log.Error().Err(err).Str("SnapshotID", snapshot.ID).Msg("Failed to set snapshot image exists to false")
			}
		}

		if !baseExists {
			if err := db.SetSnapImageExists(ctx, baseImg.ID, false); err != nil {
				log.Error().Err(err).Str("SnapshotID", snapshot.ID).Msg("Failed to set baseline image exists to false")
			}

			snapshot.Status = models.SNAPSHOT_STATUS_MISSING_BASELINE
			return db.UpdateSnapshot(snapshot)
		}

		if !snapExists {
			return err
		}
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

	diffImage, err := imageDiff.Diff(snapshotImage, baselineImage, imageDiff.Options{Threshold: project.SnapshotThreshold, Blur: project.SnapshotBlur, AntiAliasingDetection: true})
	if err != nil {
		log.Error().Err(err).Str("SnapshotID", snapshot.ID).Msg("Failed to generate diff image")
		return err
	}

	if diffImage.Equal {
		log.Info().Str("SnapshotID", snapshot.ID).Msg("Diff image is equal to baseline after comparing pixels, setting to unchanged")
		snapshot.Status = models.SNAPSHOT_STATUS_UNCHANGED
		snapshot.BaselineID = baselineSnapshot.BaselineID
		return db.UpdateSnapshot(snapshot)
	}

	buff := new(bytes.Buffer)

	err = png.Encode(buff, diffImage.Image)
	if err != nil {
		log.Error().Err(err).Str("SnapshotID", snapshot.ID).Msg("Failed to encode diff image")
		return err
	}

	hash, err := generateBytesHash(buff.Bytes())
	if err != nil {
		log.Error().Err(err).Str("SnapshotID", snapshot.ID).Msg("Failed to generate hash for diff image")
		return err
	}

	diffPath := stores.GetDiffPath(snapImg.ProjectID, hash)

	exists, err := s3.KeyExists(ctx, os.Getenv("S3_BUCKET"), diffPath)
	if err != nil {
		log.Error().Err(err).Str("SnapshotID", snapshot.ID).Msg("Failed to check if diff image exists in S3")
		return err
	}

	if !exists {
		if err = s3.UploadFile(ctx, os.Getenv("S3_BUCKET"), diffPath, buff.Bytes(), "image/png"); err != nil {
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

		if err := db.CreateDiffImage(&diffImg); err != nil {
			if driverErr, ok := err.(*pq.Error); ok && (driverErr.Code == pq.ErrorCode("23503") || driverErr.Code == pq.ErrorCode("23505")) {
				// We've created a diff image in the meantime so we can ignore this error and get the newly created diff image
				diffImg, err = db.GetDiffImage(hash, snapImg.ProjectID)
				if err != nil {
					log.Error().Err(err).Str("SnapshotID", snapshot.ID).Msg("Failed to get diff image from DB")
					return err
				}

			} else {

				log.Error().Err(err).Str("SnapshotID", snapshot.ID).Msg("Failed to create diff image")
				return err
			}
		}
	}

	snapshot.DiffID = &diffImg.ID
	snapshot.Status = models.SNAPSHOT_STATUS_UNREVIEWED

	// If we're on a branch that is set to auto approve, then we can go ahead and approve the snapshot
	if project.AutoApprove != "" {
		match, _ := regexp.MatchString(project.AutoApprove, build.Branch)
		if match {
			snapshot.Status = models.SNAPSHOT_STATUS_APPROVED
		}
	}

	return db.UpdateSnapshot(snapshot)
}

// group the snapshots into new, changed and unchanged
// We also pair the snapshots with their baselines if they exist
func groupSnapshots(snapshots []models.Snapshot, baselines []models.Snapshot) (newSnapshots []string, unchangedSnapshots [][2]models.Snapshot, unreviewedSnapshots [][2]models.Snapshot, changedSnapshots [][2]models.Snapshot, rejectedSnapshots [][2]models.Snapshot) {
	for _, snapshot := range snapshots {
		found := false
		for _, baseline := range baselines {
			if models.CompareSnaps(snapshot, baseline) {
				found = true

				//  we can assume that the snapshots won't be an error as that should also be reflected by the build
				if snapshot.SnapID == baseline.SnapID {
					if baseline.Status == models.SNAPSHOT_STATUS_UNCHANGED || baseline.Status == models.SNAPSHOT_STATUS_APPROVED || baseline.Status == models.SNAPSHOT_STATUS_ORPHANED || baseline.Status == models.SNAPSHOT_STATUS_MISSING_BASELINE {
						unchangedSnapshots = append(unchangedSnapshots, [2]models.Snapshot{snapshot, baseline})
					} else if baseline.Status == models.SNAPSHOT_STATUS_REJECTED {
						rejectedSnapshots = append(rejectedSnapshots, [2]models.Snapshot{snapshot, baseline})
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

	log.Debug().
		Str("New", strings.Join(newSnapshots, ", ")).
		Str("Unchanged", fmt.Sprintf("%v", unchangedSnapshots)).
		Str("Unreviewed", fmt.Sprintf("%v", unreviewedSnapshots)).
		Str("Changed", fmt.Sprintf("%v", changedSnapshots)).
		Msg("Grouped snapshots")

	return newSnapshots, unchangedSnapshots, unreviewedSnapshots, changedSnapshots, rejectedSnapshots
}

func compareBuilds(ctx context.Context, project models.Project, snapshots []models.Snapshot, baselines []models.Snapshot, build models.Build) error {

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	newSnapshots, unchangedSnapshots, unreviewedSnapshots, changedSnapshots, rejectedSnapshots := groupSnapshots(snapshots, baselines)

	if len(newSnapshots) > 0 {
		// We can go ahead and mark the new snapshots as orphaned

		if err := db.SetSnapshotsStatus(ctx, newSnapshots, models.SNAPSHOT_STATUS_ORPHANED); err != nil {
			log.Error().Err(err).Str("Snapshots", strings.Join(newSnapshots, ", ")).Str("BuildID", build.ID).Msg("Failed to set snapshots status to orphaned")
			// We don't want to return this error because we still want to process the remaining snapshots
			if err := db.SetSnapshotsStatus(ctx, newSnapshots, models.SNAPSHOT_STATUS_FAILED); err != nil {
				log.Error().Err(err).Str("BuildID", build.ID).Msg("Failed to set build status to failed")
			}
		}
	}

	snapshotsToUpdate := []models.Snapshot{}

	for _, snap := range unchangedSnapshots {
		base := snap[1]
		snapshot := snap[0]
		snapshot.BaselineID = &base.ID
		snapshot.Status = models.SNAPSHOT_STATUS_UNCHANGED

		snapshotsToUpdate = append(snapshotsToUpdate, snapshot)
	}

	for _, snap := range unreviewedSnapshots {
		base := snap[1]
		snapshot := snap[0]
		snapshot.BaselineID = base.BaselineID
		snapshot.Status = models.SNAPSHOT_STATUS_UNREVIEWED
		snapshot.DiffID = base.DiffID

		snapshotsToUpdate = append(snapshotsToUpdate, snapshot)
	}

	for _, snap := range rejectedSnapshots {
		base := snap[1]
		snapshot := snap[0]
		snapshot.BaselineID = base.BaselineID
		snapshot.Status = models.SNAPSHOT_STATUS_REJECTED
		snapshot.DiffID = base.DiffID

		snapshotsToUpdate = append(snapshotsToUpdate, snapshot)
	}

	for _, snap := range changedSnapshots {

		base := snap[1]
		snapshot := snap[0]

		err := processSnapshot(ctx, project, build, snapshot, base, db)

		if err != nil {
			log.Error().Err(err).Str("SnapshotID", snapshot.ID).Msg("Failed to process snapshot")

			snapshot.Status = models.SNAPSHOT_STATUS_FAILED
			snapshot.Error = fmt.Sprintf("Failed to process snapshot: %s", err.Error())

			snapshotsToUpdate = append(snapshotsToUpdate, snapshot)
		}

	}

	if len(snapshotsToUpdate) > 0 {
		if err := db.BatchUpdateSnapshot(ctx, snapshotsToUpdate); err != nil {
			log.Error().Err(err).Msg("Failed to batch update snapshots")

			if err := db.SetSnapshotsStatus(ctx, newSnapshots, models.SNAPSHOT_STATUS_FAILED); err != nil {
				log.Error().Err(err).Str("BuildID", build.ID).Msg("Failed to set build status to failed")

				return err
			}

			return err
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
func IngestSnapshots(ctx context.Context, snapshotIDs []string) error {

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

	build, err := db.GetBuild(ctx, snapshots[0].BuildID)
	if err != nil {
		return err
	}

	project, err := db.GetProject(ctx, build.ProjectID)
	if err != nil {
		return err
	}

	log.Debug().Interface("Build", build).Msg("Build snapshots are from")

	targetBuilds, err := db.GetBuildTargets(ctx, build.ID)
	if err != nil {
		return err
	}

	if len(targetBuilds) == 0 {
		log.Info().Str("BuildID", build.ID).Msg("Build has no target builds, marking all snapshots as orphaned")

		if err = db.SetSnapshotsStatus(ctx, snapshotIDs, models.SNAPSHOT_STATUS_ORPHANED); err != nil {

			// We don't want to return the error as we still want to check and update the build status

			log.Error().Err(err).Str("BuildID", build.ID).Msg("Failed to set snapshots status to orphaned")

			// It's unlikely this will also work but we can try
			if err := db.SetSnapshotsStatus(ctx, snapshotIDs, models.BUILD_STATUS_FAILED); err != nil {
				log.Error().Err(err).Str("BuildID", build.ID).Msg("Failed to set build status to failed")
			}
		}
	} else {

		targetIDs := []string{}
		for _, target := range targetBuilds {
			targetIDs = append(targetIDs, target.ID)
		}

		targetSnapshots, err := db.GetLatestSnapshots(ctx, targetIDs)
		if err != nil {
			return err
		}

		if err := compareBuilds(ctx, project, snapshots, targetSnapshots, build); err != nil {
			return err
		}
	}

	if err := statuses_build.SyncBuildStatus(ctx, &build); err != nil {
		return err
	}

	return nil
}
