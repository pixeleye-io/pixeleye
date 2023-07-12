package queries

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
)

type SnapshotQueries struct {
	*sqlx.DB
}

func (q *SnapshotQueries) GetSnapshot(id uuid.UUID) (models.Snapshot, error) {
	snapshot := models.Snapshot{}

	query := `SELECT * FROM snapshot WHERE id = $1`

	err := q.Get(&snapshot, query, id)

	return snapshot, err
}

func (q *SnapshotQueries) GetSnapshotsByBuild(buildID uuid.UUID) ([]models.Snapshot, error) {
	snapshots := []models.Snapshot{}

	query := `SELECT * FROM snapshot WHERE build_id = $1`

	err := q.Select(&snapshots, query, buildID)

	return snapshots, err
}

func getDuplicateSnapError(snap models.Snapshot) string {
	errTxt := "Duplicate snapshots with name: " + snap.Name

	if snap.Variant != "" {
		if snap.Target == "" {
			return errTxt + " and variant: " + snap.Variant
		} else {
			return errTxt + ", variant: " + snap.Variant + " and target: " + snap.Target
		}
	}

	if snap.Target != "" {
		return errTxt + " and target: " + snap.Target
	}

	return errTxt
}

// Assumes we have no duplicate snapshots passed in
func (q *SnapshotQueries) CreateBatchSnapshots(snapshots []models.Snapshot, buildId uuid.UUID) ([]models.Snapshot, error) {
	selectBuildQuery := `SELECT * FROM build WHERE id = $1 FOR UPDATE`
	selectExistingSnapshotsQuery := `SELECT * FROM snapshot WHERE build_id = $1`
	snapQuery := `INSERT INTO snapshot (id, build_id, name, variant, target, url) VALUES (:id, :build_id, :name, :variant, :target, :url)`
	buildQuery := `UPDATE build SET status = :status, errors = :errors WHERE id = :id`

	if len(snapshots) == 0 {
		return nil, echo.NewHTTPError(http.StatusBadRequest, "no snapshots to create")
	}

	ctx := context.Background()

	tx, err := q.BeginTxx(ctx, nil)

	if err != nil {
		return nil, err
	}

	defer tx.Rollback()

	build := models.Build{}

	if err = tx.GetContext(ctx, &build, selectBuildQuery, buildId); err != nil || build.ID == uuid.Nil {
		return nil, echo.NewHTTPError(http.StatusNotFound, "build with id %s not found", buildId)
	}

	if build.Status != models.BUILD_STATUS_ABORTED && build.Status != models.BUILD_STATUS_UPLOADING {
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
			snap.ID = uuid.New()
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
		if _, err := tx.NamedExecContext(ctx, buildQuery, build); err != nil {
			return nil, err
		}
	}

	if _, err = tx.NamedExecContext(ctx, snapQuery, newSnapshots); err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return newSnapshots, nil
}
