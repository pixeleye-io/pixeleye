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
)

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

func getDuplicateSnapWarning(snap models.Snapshot) string {
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

	errTxt += " - this could be due to a test running multiple times or different snapshots with the same details"

	return errTxt
}

// TODO - handle scenario where build is stuck in uploading
// We should add a mechanism to ensure the build is not stuck in uploading, maybe sse?
// If connection is lost, then we mark the build as failed

// Assumes we have no duplicate snapshots passed in
func (q *SnapshotQueries) CreateBatchSnapshots(ctx context.Context, snapshots []models.Snapshot, build *models.Build) ([]models.Snapshot, bool, error) {
	selectExistingSnapshotsQuery := `SELECT * FROM snapshot WHERE build_id = $1`
	snapQuery := `INSERT INTO snapshot (id, build_id, name, variant, target, target_icon, viewport, created_at, updated_at, snap_image_id, status, error) VALUES (:id, :build_id, :name, :variant, :target, :target_icon, :viewport, :created_at, :updated_at, :snap_image_id, :status, :error) ON CONFLICT (build_id, name, variant, target, viewport) DO UPDATE SET updated_at = EXCLUDED.updated_at, snap_image_id = EXCLUDED.snap_image_id, status = EXCLUDED.status, error = EXCLUDED.error RETURNING *`

	buildQueryAppend := `UPDATE build SET warnings = array_append(warnings, $1), updated_at = $2 WHERE id = $3`

	if len(snapshots) == 0 {
		return nil, false, echo.NewHTTPError(http.StatusBadRequest, "no snapshots to create")
	}

	if !models.IsBuildPreProcessing(build.Status) {
		return nil, false, echo.NewHTTPError(http.StatusBadRequest, "build with id %s has already been marked as completed. You cannot continue to add snapshots to it", build.ID)
	}

	existingSnapshots := []models.Snapshot{}

	if err := q.SelectContext(ctx, &existingSnapshots, selectExistingSnapshotsQuery, build.ID); err != nil {
		return nil, false, err
	}

	newSnapshots := []models.Snapshot{}

	warnings := pq.StringArray{}

	// TODO move this to a separate function, so we can test it
	for i, snap := range snapshots {
		isDup := false
		// Check there aren't any duplicates in the new snapshots.
		for j := i + 1; j < len(snapshots); j++ {
			snapAfter := snapshots[j]

			if models.CompareSnaps(snap, snapAfter) {

				isDup = true
				warningsTxt := getDuplicateSnapWarning(snap)
				if !utils.ContainsString(build.Warnings, warningsTxt) || !utils.ContainsString(warnings, warningsTxt) {
					// No need to update build if the warning for this snapshot already exists.
					warnings = append(warnings, warningsTxt)
				}
				break
			}
		}
		if !isDup {
			// No need to check for any more duplicates as we've already found one.
			// Check there aren't any duplicates in the existing snapshots.
			for _, existingSnapshot := range existingSnapshots {
				if models.CompareSnaps(snap, existingSnapshot) {
					// We still want to update the snapshot even if it's a duplicate

					warningTxt := getDuplicateSnapWarning(snap)
					if !utils.ContainsString(build.Warnings, warningTxt) || !utils.ContainsString(warnings, warningTxt) {
						// No need to update build if the warning for this snapshot already exists.
						warnings = append(warnings, warningTxt)
					}
				}
			}
		}

		if !isDup {

			var err error
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

	if len(warnings) > 0 {
		build.UpdatedAt = utils.CurrentTime()
		build.Warnings = append(build.Warnings, warnings...)
		if _, err := q.ExecContext(ctx, buildQueryAppend, warnings, build.UpdatedAt, build.ID); err != nil {
			return nil, false, err
		}
	}

	if rows, err := q.NamedQueryContext(ctx, snapQuery, newSnapshots); err != nil {
		return nil, false, err
	} else {
		insertedSnapshots := []models.Snapshot{}
		for rows.Next() {
			var snap models.Snapshot
			if err := rows.StructScan(&snap); err != nil {
				return nil, false, err
			}
			insertedSnapshots = append(insertedSnapshots, snap)
		}

		return insertedSnapshots, false, nil
	}

}
