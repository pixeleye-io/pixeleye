package snapshot_queries

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/jmoiron/sqlx"
	"github.com/labstack/echo/v4"
	"github.com/lib/pq"
	nanoid "github.com/matoous/go-nanoid/v2"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/rs/zerolog/log"
)

// We shouldn't need to update name, variant, target, or viewport
func (tx *SnapshotQueriesTx) UpdateSnapshot(ctx context.Context, snapshot *models.Snapshot) error {
	query := `UPDATE snapshot SET status = :status, baseline_snapshot_id = :baseline_snapshot_id, diff_image_id = :diff_image_id, reviewer_id = :reviewer_id, reviewed_at = :reviewed_at, updated_at = :updated_at, error = :error WHERE id = :id`

	snapshot.UpdatedAt = utils.CurrentTime()

	_, err := tx.NamedExecContext(ctx, query, snapshot)

	return err
}

// We shouldn't need to update name, variant, target, or viewport
func (q *SnapshotQueries) UpdateSnapshot(snapshot models.Snapshot) error {
	query := `UPDATE snapshot SET status = :status, baseline_snapshot_id = :baseline_snapshot_id, diff_image_id = :diff_image_id, reviewer_id = :reviewer_id, reviewed_at = :reviewed_at, updated_at = :updated_at, error = :error WHERE id = :id`

	snapshot.UpdatedAt = utils.CurrentTime()

	_, err := q.NamedExec(query, snapshot)

	return err
}

func (q *SnapshotQueries) BatchUpdateSnapshot(ctx context.Context, snapshots []models.Snapshot) error {
	query := `UPDATE snapshot SET status = :status, baseline_snapshot_id = :baseline_snapshot_id, diff_image_id = :diff_image_id, reviewer_id = :reviewer_id, reviewed_at = :reviewed_at, updated_at = :updated_at, error = :error WHERE id = :id`

	prepared, err := q.PrepareNamed(query)
	if err != nil {
		return err
	}

	time := utils.CurrentTime()

	for i := range snapshots {
		snapshots[i].UpdatedAt = time

		_, err := prepared.ExecContext(ctx, snapshots[i])
		if err != nil {
			return err
		}
	}

	return nil
}

func (q *SnapshotQueries) SetSnapshotsStatus(ctx context.Context, ids []string, status string) error {
	query, args, err := sqlx.In(`UPDATE snapshot SET status = ? WHERE id IN (?)`, status, ids)

	if err != nil {
		return err
	}

	query = q.Rebind(query)

	_, err = q.ExecContext(ctx, query, args...)

	return err
}

func (tx *SnapshotQueriesTx) BatchUpdateSnapshotStatus(ctx context.Context, snapshotIDs []string, status string) error {

	query, args, err := sqlx.In(`UPDATE snapshot SET status = ?, updated_at = ? WHERE id IN (?)`, status, utils.CurrentTime(), snapshotIDs)

	if err != nil {
		return err
	}

	query = tx.Rebind(query)

	_, err = tx.ExecContext(ctx, query, args...)

	return err
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

// TODO - handle scenario where build is stuck in uploading
// We should add a mechanism to ensure the build is not stuck in uploading, maybe sse?
// If connection is lost, then we mark the build as failed

// Assumes we have no duplicate snapshots passed in
func (q *SnapshotQueries) CreateBatchSnapshots(snapshots []models.Snapshot, build models.Build) ([]models.Snapshot, bool, error) {
	selectExistingSnapshotsQuery := `SELECT * FROM snapshot WHERE build_id = $1`
	snapQuery := `INSERT INTO snapshot (id, build_id, name, variant, target, target_icon, viewport, created_at, updated_at, snap_image_id, status, error) VALUES (:id, :build_id, :name, :variant, :target, :target_icon, :viewport, :created_at, :updated_at, :snap_image_id, :status, :error)`

	buildQueryAppend := `UPDATE build SET errors = array_append(errors, $1), status = 'failed', updated_at = $2 WHERE id = $3`

	if len(snapshots) == 0 {
		return nil, false, echo.NewHTTPError(http.StatusBadRequest, "no snapshots to create")
	}

	ctx := context.Background()

	tx, err := q.BeginTxx(ctx, nil)

	if err != nil {
		return nil, false, err
	}

	committed := false

	defer func() {
		if !committed {
			if err := tx.Rollback(); err != nil {
				log.Error().Err(err).Msg("Rollback failed")
			}
		}
	}()

	if !models.IsBuildPreProcessing(build.Status) {
		return nil, false, echo.NewHTTPError(http.StatusBadRequest, "build with id %s has already been marked as completed. You cannot continue to add snapshots to it", build.ID)
	}

	existingSnapshots := []models.Snapshot{}

	if err = tx.SelectContext(ctx, &existingSnapshots, selectExistingSnapshotsQuery, build.ID); err != nil {
		return nil, false, err
	}

	newSnapshots := []models.Snapshot{}

	errors := pq.StringArray{}

	// TODO move this to a separate function, so we can test it
	for i, snap := range snapshots {
		isDup := false
		// Check there aren't any duplicates in the new snapshots.
		for j := i + 1; j < len(snapshots); j++ {
			snapAfter := snapshots[j]

			if models.CompareSnaps(snap, snapAfter) {
				isDup = true
				errorTxt := getDuplicateSnapError(snap)
				if !utils.ContainsString(build.Errors, errorTxt) || !utils.ContainsString(errors, errorTxt) {
					// No need to update build if the error for this snapshot already exists.
					errors = append(errors, errorTxt)
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
				if !utils.ContainsString(build.Errors, errorTxt) || !utils.ContainsString(errors, errorTxt) {
					// No need to update build if the error for this snapshot already exists.
					errors = append(errors, errorTxt)
				}
			}
		}

		if !isDup {
			snap.ID, err = nanoid.New()
			if err != nil {
				return nil, false, err
			}
			time := utils.CurrentTime()
			snap.CreatedAt = time
			snap.UpdatedAt = time
			// We can't start asynchronously processing the build until our dependant builds are done
			if build.Status == models.BUILD_STATUS_QUEUED_UPLOADING {
				snap.Status = models.SNAPSHOT_STATUS_QUEUED
			} else {
				snap.Status = models.SNAPSHOT_STATUS_PROCESSING
			}

			snap.BuildID = build.ID
			newSnapshots = append(newSnapshots, snap)
		}
	}

	if len(newSnapshots) == 0 {
		return nil, false, echo.NewHTTPError(http.StatusAccepted, "no new snapshots to upload")
	}

	validate := utils.NewValidator()

	partial := models.Partial{
		Snapshots: newSnapshots,
	}

	if err := validate.Struct(partial); err != nil {
		msg, _ := json.Marshal(utils.ValidatorErrors(err))
		return nil, false, echo.NewHTTPError(http.StatusBadRequest, string(msg))
	}

	if len(errors) > 0 {
		build.UpdatedAt = utils.CurrentTime()
		build.Errors = append(build.Errors, errors...)
		if _, err := tx.ExecContext(ctx, buildQueryAppend, errors, build.UpdatedAt, build.ID); err != nil {
			return nil, false, err
		}
	}

	if _, err = tx.NamedExecContext(ctx, snapQuery, newSnapshots); err != nil {
		return nil, false, err
	}

	if err := tx.Commit(); err != nil {
		return nil, false, err
	}

	committed = true

	return newSnapshots, len(errors) > 0, nil
}
