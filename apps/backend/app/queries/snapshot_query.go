package queries

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/pixeleye-io/pixeleye/app/models"
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

func (q *SnapshotQueries) CreateBatchSnapshots(snapshots []models.Snapshot, updateBuild bool, build *models.Build) error {
	snapQuery := `INSERT INTO snapshot (id, build_id, name, variant, target, url) VALUES (:id, :build_id, :name, :variant, :target, :url)`
	buildQuery := `UPDATE build SET status = :status, errors = :errors WHERE id = :id`

	ctx := context.Background()

	tx, err := q.BeginTxx(ctx, nil)

	if err != nil {
		return err
	}

	if len(snapshots) != 0 {
		_, err = tx.NamedExec(snapQuery, snapshots)
	}

	fmt.Printf("addSnaps: %v\n", err)

	if updateBuild {
		_, err = tx.NamedExec(buildQuery, build)
		fmt.Printf("updateBuild2: %v\n", err)

	}

	if err != nil {
		tx.Rollback()
		return err
	}

	err = tx.Commit()

	return err
}
