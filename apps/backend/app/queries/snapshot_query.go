package queries

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/jmoiron/sqlx"
	"github.com/labstack/echo/v4"
	nanoid "github.com/matoous/go-nanoid/v2"
	"github.com/pixeleye-io/pixeleye/app/events"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/rs/zerolog/log"
)

type SnapshotQueries struct {
	*sqlx.DB
}

func (q *SnapshotQueries) GetSnapshot(id string) (models.Snapshot, error) {
	snapshot := models.Snapshot{}

	query := `SELECT * FROM snapshot WHERE id = $1`

	err := q.Get(&snapshot, query, id)

	return snapshot, err
}

func (q *SnapshotQueries) GetLastApprovedInHistory(id string) (models.Snapshot, error) {
	snapshot := models.Snapshot{}

	query := `WITH RECURSIVE find_approved_snapshot AS (
		-- Anchor query: Get the initial snapshot with the given snapshot_id
		SELECT
		  s.id,
		  s.name,
		  s.variant,
		  s.target,
		  s.viewport,
		  s.status,
		  0 AS depth
		FROM snapshot s
		WHERE s.id = $1
	  
		UNION ALL
	  
		-- Recursive query: Join with build_history to get the next snapshot in the build history
		SELECT
		  s.id,
		  s.name,
		  s.variant,
		  s.target,
		  s.viewport,
		  s.status,
		  f.depth + 1
		FROM find_approved_snapshot f
		INNER JOIN build_history bh ON f.id = bh.parent_id
		INNER JOIN snapshot s ON bh.child_id = s.id
		WHERE (s.status = 'approved' OR s.status = 'orphaned') -- Considering only approved snapshots in the build history
		  AND s.name = f.name -- Matching name with the starting snapshot
		  AND s.variant = f.variant -- Matching variant with the starting snapshot
		  AND s.target = f.target -- Matching target with the starting snapshot
		  AND s.viewport = f.viewport -- Matching viewport with the starting snapshot
	  )
	  -- Final query: Select the first approved snapshot with matching name, variant, and target
	  SELECT *
	  FROM find_approved_snapshot
	  WHERE status = 'approved'
	  ORDER BY depth ASC
	  LIMIT 1;
	  `

	err := q.Get(&snapshot, query, id)

	return snapshot, err
}

func (q *SnapshotQueries) GetSnapshots(ids []string) ([]models.Snapshot, error) {
	snapshots := []models.Snapshot{}

	query, args, err := sqlx.In(`SELECT * FROM snapshot WHERE id IN (?)`, ids)

	if err != nil {
		return nil, err
	}

	query = q.Rebind(query)

	err = q.Select(&snapshots, query, args...)

	return snapshots, err
}

func (q *SnapshotQueries) SetSnapshotsStatus(ids []string, status string) error {
	query, args, err := sqlx.In(`UPDATE snapshot SET status = ? WHERE id IN (?)`, status, ids)

	if err != nil {
		return err
	}

	query = q.Rebind(query)

	_, err = q.Exec(query, args...)

	return err
}

// We shouldn't need to update name, variant, target, or viewport
func (q *SnapshotQueries) UpdateSnapshot(snapshot models.Snapshot) error {
	query := `UPDATE snapshot SET status = :status, baseline_snapshot_id = :baseline_snapshot_id, diff_image_id = :diff_image_id, reviewer_id = :reviewer_id, reviewed_at = :reviewed_at, updated_at = :updated_at WHERE id = :id`

	snapshot.UpdatedAt = utils.CurrentTime()

	_, err := q.NamedExec(query, snapshot)

	return err
}

func (q *SnapshotQueries) GetSnapshotsByBuild(buildID string) ([]models.Snapshot, error) {
	snapshots := []models.Snapshot{}

	query := `SELECT * FROM snapshot WHERE build_id = $1`

	err := q.Select(&snapshots, query, buildID)

	return snapshots, err
}

func getDuplicateSnapError(snap models.Snapshot) string {
	errTxt := "Duplicate snapshots with "

	conflicting := []string{fmt.Sprintf("name: %s", snap.Name)}

	if snap.Variant != "" {
		conflicting = append(conflicting, fmt.Sprintf("variant: %s", snap.Variant))
	}

	if snap.Target != "" {
		conflicting = append(conflicting, fmt.Sprintf("target: %s", snap.Target))
	}

	if snap.Viewport != "" {
		conflicting = append(conflicting, fmt.Sprintf("viewport: %s", snap.Viewport))
	}

	if len(conflicting) > 0 {
		errTxt += utils.JoinStringsGrammatically(conflicting)
	}

	return errTxt
}

// TODO - refactor build status updates to use a single function so we can centralize the notifications

// TODO - handle scenario where build is stuck in uploading
// We should add a mechanism to ensure the build is not stuck in uploading, maybe sse?
// If connection is lost, then we mark the build as failed

// Assumes we have no duplicate snapshots passed in
func (q *SnapshotQueries) CreateBatchSnapshots(snapshots []models.Snapshot, buildId string) ([]models.Snapshot, error) {
	selectBuildQuery := `SELECT * FROM build WHERE id = $1 FOR UPDATE`
	selectExistingSnapshotsQuery := `SELECT * FROM snapshot WHERE build_id = $1`
	snapQuery := `INSERT INTO snapshot (id, build_id, name, variant, target, viewport, created_at, updated_at, snap_image_id) VALUES (:id, :build_id, :name, :variant, :target, :viewport, :created_at, :updated_at, :snap_image_id)`
	buildQuery := `UPDATE build SET status = :status, errors = :errors WHERE id = :id`

	if len(snapshots) == 0 {
		return nil, echo.NewHTTPError(http.StatusBadRequest, "no snapshots to create")
	}

	ctx := context.Background()

	tx, err := q.BeginTxx(ctx, nil)

	if err != nil {
		return nil, err
	}

	// nolint:errcheck
	defer tx.Rollback()

	build := models.Build{}

	if err = tx.GetContext(ctx, &build, selectBuildQuery, buildId); err != nil || build.ID == "" {
		return nil, echo.NewHTTPError(http.StatusNotFound, "build with id %s not found", buildId)
	}

	if !models.IsBuildPreProcessing(build) {
		return nil, echo.NewHTTPError(http.StatusBadRequest, "build with id %s has completed. You cannot continue to add snapshots to it", buildId)
	}

	existingSnapshots := []models.Snapshot{}

	if err = tx.SelectContext(ctx, &existingSnapshots, selectExistingSnapshotsQuery, buildId); err != nil {
		return nil, err
	}

	newSnapshots := []models.Snapshot{}

	// flag to check if there are duplicate snapshots
	updateBuild := false

	// TODO move this to a separate function, so we can test it
	for i, snap := range snapshots {
		isDup := false
		// Check there aren't any duplicates in the new snapshots.
		for j := i + 1; j < len(snapshots); j++ {
			snapAfter := snapshots[j]

			if models.CompareSnaps(snap, snapAfter) {
				isDup = true
				errorTxt := getDuplicateSnapError(snap)
				if !utils.ContainsString(build.Errors, errorTxt) {
					// No need to update build if the error for this snapshot already exists.
					build.Errors = append(build.Errors, errorTxt)
					build.Status = models.BUILD_STATUS_ABORTED
					updateBuild = true
				}
				break // No need to check for anymore duplicates of this snapshot.
			}
		}
		if isDup {
			// No need to check for anymore duplicates. Continue to next snapshot.
			isDup = false
			continue
		}
		// Check there aren't any duplicates in the existing snapshots.
		for _, existingSnapshot := range existingSnapshots {
			if models.CompareSnaps(snap, existingSnapshot) {
				isDup = true
				errorTxt := getDuplicateSnapError(snap)
				if !utils.ContainsString(build.Errors, errorTxt) {
					// No need to update build if the error for this snapshot already exists.
					build.Errors = append(build.Errors, errorTxt)
					build.Status = models.BUILD_STATUS_ABORTED
					updateBuild = true
				}
			}
		}

		if !isDup {
			snap.ID, err = nanoid.New()
			time := utils.CurrentTime()
			snap.CreatedAt = time
			snap.UpdatedAt = time
			if build.Status == models.BUILD_STATUS_QUEUED_UPLOADING {
				snap.Status = models.SNAPSHOT_STATUS_QUEUED
			} else {
				snap.Status = models.SNAPSHOT_STATUS_PROCESSING
			}

			if err != nil {
				return nil, err
			}
			snap.BuildID = build.ID
			newSnapshots = append(newSnapshots, snap)
		}
	}

	if len(newSnapshots) == 0 {
		return nil, echo.NewHTTPError(http.StatusBadRequest, "no new snapshots to upload")
	}

	validate := utils.NewValidator()

	partial := models.Partial{
		Snapshots: newSnapshots,
	}

	if err := validate.Struct(partial); err != nil {
		msg, _ := json.Marshal(utils.ValidatorErrors(err))
		return nil, echo.NewHTTPError(http.StatusBadRequest, string(msg))
	}

	if updateBuild {
		build.UpdatedAt = utils.CurrentTime()
		if _, err := tx.NamedExecContext(ctx, buildQuery, build); err != nil {
			return nil, err
		}

		go func(build models.Build) {
			bq := BuildQueries{q.DB}

			if err := bq.CheckAndProcessQueuedBuilds(build.ID); err != nil {
				log.Error().Err(err).Msg("error processing queued builds")
			}
		}(build)

		go func(build models.Build) {
			notifier, err := events.GetNotifier(nil)
			if err != nil {
				log.Error().Err(err).Msg("Failed to get notifier")
				return
			}
			notifier.BuildStatusChange(build)
		}(build)

	}

	if _, err = tx.NamedExecContext(ctx, snapQuery, newSnapshots); err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return newSnapshots, nil
}
