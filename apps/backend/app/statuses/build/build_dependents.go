package statuses_build

import (
	"context"
	"fmt"
	"time"

	"github.com/pixeleye-io/pixeleye/app/events"
	"github.com/pixeleye-io/pixeleye/app/models"
	build_queries "github.com/pixeleye-io/pixeleye/app/queries/build"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/pixeleye-io/pixeleye/platform/broker"
	"github.com/pixeleye-io/pixeleye/platform/database"
	"github.com/rs/zerolog/log"
)

func queueSnapshots(tx *build_queries.BuildQueriesTx, ctx context.Context, build *models.Build) error {

	// Get all queued snaps and start processing them
	snaps, err := tx.CheckAndProcessQueuedSnapshots(ctx, *build)
	if err != nil {
		return err
	}

	if len(snaps) == 0 && build.Status == models.BUILD_STATUS_PROCESSING {
		// We aren't going to have more snaps uploaded and we don't have any queued snaps
		build.Status, err = tx.CalculateBuildStatusFromSnapshotsIgnoringQueued(ctx, *build)
		return err
	}

	// Send our snapshots to the message queue
	if b, err := broker.GetBroker(); err != nil {
		return err
	} else if err := b.QueueSnapshotsIngest(snaps); err != nil {
		log.Error().Err(err).Msgf("Failed to queue snapshots for build %s", build.ID)
		return err
	}

	return nil
}

func SyncBuildStatus(ctx context.Context, build *models.Build) error {
	return syncBuildStatusInternal(ctx, build, make(map[string]bool))
}

// Checks to see if we can update the build status based on snapshots and parent builds
func syncBuildStatusInternal(ctx context.Context, build *models.Build, processed map[string]bool) error {
	if processed[build.ID] {
		log.Info().Msgf("Already processed build %s", build.ID)
		return nil
	}
	processed[build.ID] = true

	defer utils.LogTimeTaken(time.Now(), "SyncBuildStatus")

	prevBuildStatus := build.Status

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	tx, err := build_queries.NewBuildTx(db.DBx, ctx)
	if err != nil {
		return err
	}

	// We want to lock the build and make sure we have the latest data
	curBuild, err := tx.GetBuildForUpdate(ctx, build.ID)
	if err != nil {
		return err
	}
	build.Status = curBuild.Status

	completed := false
	defer func(completed *bool) {
		if !*completed {
			if err := tx.Rollback(); err != nil {
				log.Error().Err(err).Msg("failed to rollback transaction")
			}
		}
	}(&completed)

	if models.IsBuildPostProcessing(build.Status) {
		build.Status, err = tx.CalculateBuildStatusFromSnapshotsIgnoringQueued(ctx, *build)
		if err != nil {
			return err
		}
	} else {

		// Lets check if all the builds dependencies are done
		if fin, err := db.AreBuildDependenciesPostProcessing(ctx, *build); err != nil {
			return err
		} else if !fin {
			return nil
		}

		if build.Status == models.BUILD_STATUS_QUEUED_UPLOADING {
			build.Status = models.BUILD_STATUS_UPLOADING
		} else if build.Status == models.BUILD_STATUS_QUEUED_PROCESSING {
			build.Status = models.BUILD_STATUS_PROCESSING // We need to set this before we calculate the true status
			build.Status, err = tx.CalculateBuildStatusFromSnapshotsIgnoringQueued(ctx, *build)
			if err != nil {
				return err
			}
		}

		if !models.IsBuildQueued(build.Status) {
			if err := queueSnapshots(tx, ctx, build); err != nil {
				return err
			}
		}
	}

	if prevBuildStatus != build.Status {
		if err := tx.UpdateBuildStatus(ctx, build); err != nil {
			return err
		}
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	completed = true

	if prevBuildStatus != build.Status {
		events.HandleBuildStatusChange(*build)
	}

	if models.IsBuildPostProcessing(build.Status) {
		if err := processBuildDependentsInternal(ctx, *build, processed); err != nil {
			log.Debug().Err(err).Msgf("Failed to process queued builds for build %s", build.ID)
		}
	}

	return nil
}

func ProcessBuildDependents(ctx context.Context, build models.Build) error {
	return processBuildDependentsInternal(ctx, build, make(map[string]bool))
}

func processBuildDependentsInternal(ctx context.Context, build models.Build, processed map[string]bool) error {

	// Child builds will only have updates if their parents have finished processing
	if !models.IsBuildPostProcessing(build.Status) {
		return nil
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	dependents, err := db.GetBuildDirectDependents(ctx, build)
	if err != nil {
		return err
	}

	for _, dependent := range dependents {
		if err := syncBuildStatusInternal(ctx, &dependent, processed); err != nil {
			log.Debug().Err(err).Msgf("Failed to process queued builds for build %s", dependent.ID)
		}
	}

	return nil
}

func FailBuild(ctx context.Context, build *models.Build) error {

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	tx, err := build_queries.NewBuildTx(db.DBx, ctx)
	if err != nil {
		return err
	}

	completed := false
	defer func(completed *bool) {
		if !*completed {
			if err := tx.Rollback(); err != nil {
				log.Error().Err(err).Msg("failed to rollback transaction")
			}
		}
	}(&completed)

	// We want to lock the build and make sure we have the latest data
	curBuild, err := tx.GetBuildForUpdate(ctx, build.ID)
	if err != nil {
		return err
	}
	build = &curBuild

	if models.IsBuildPostProcessing(build.Status) {
		// Build has already been marked as complete
		return fmt.Errorf("build has already finished processing")
	}

	build.Status = models.BUILD_STATUS_FAILED

	if err := tx.UpdateBuildStatus(ctx, build); err != nil {
		return err
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	completed = true

	events.HandleBuildStatusChange(*build)

	if err := ProcessBuildDependents(ctx, *build); err != nil {
		log.Debug().Err(err).Msgf("Failed to process queued builds for build %s", build.ID)
	}

	return nil
}

func CompleteBuild(ctx context.Context, build *models.Build) (bool, error) {
	db, err := database.OpenDBConnection()
	if err != nil {
		return false, err
	}

	tx, err := build_queries.NewBuildTx(db.DBx, ctx)
	if err != nil {
		return false, err
	}

	completed := false
	defer func(completed *bool) {
		if !*completed {
			if err := tx.Rollback(); err != nil {
				log.Error().Err(err).Msg("Failed to rollback transaction")
			}
		}
	}(&completed)
	// We want to lock the build and make sure we have the latest data
	curBuild, err := tx.GetBuildForUpdate(ctx, build.ID)
	if err != nil {
		return false, err
	}
	build.Status = curBuild.Status
	build.ShardingCount = curBuild.ShardingCount
	build.ShardsCompleted = curBuild.ShardsCompleted

	if build.ShardingCount > 0 {
		build.ShardsCompleted += 1

		if err := tx.UpdateBuildShardsCompleted(ctx, build); err != nil {
			return false, err
		}

		if build.ShardingCount != build.ShardsCompleted {
			// We're not ready to complete the build yet
			if err := tx.Commit(); err != nil {
				return false, err
			}

			completed = true
			return true, nil
		}
	}

	if !models.IsBuildPreProcessing(build.Status) {
		// Build has already been marked as complete
		return false, fmt.Errorf("build has already been marked as complete")
	}

	if build.Status == models.BUILD_STATUS_QUEUED_UPLOADING {
		build.Status = models.BUILD_STATUS_QUEUED_PROCESSING
	} else {
		build.Status = models.BUILD_STATUS_PROCESSING // We need to set this before we calculate the true status
		build.Status, err = tx.CalculateBuildStatusFromSnapshotsIgnoringQueued(ctx, *build)
		if err != nil {
			return false, err
		}
	}

	if err := tx.UpdateBuildStatus(ctx, build); err != nil {
		return false, err
	}

	if !models.IsBuildQueued(build.Status) {
		if err := queueSnapshots(tx, ctx, build); err != nil {
			return false, err
		}
	}

	if err := tx.Commit(); err != nil {
		return false, err
	}

	completed = true

	events.HandleBuildStatusChange(*build)

	if models.IsBuildPostProcessing(build.Status) {
		if err := ProcessBuildDependents(ctx, *build); err != nil {
			log.Debug().Err(err).Msgf("Failed to process queued builds for build %s", build.ID)
		}
	}

	return false, nil
}
