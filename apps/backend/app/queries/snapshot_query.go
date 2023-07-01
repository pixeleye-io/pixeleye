package queries

import (
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

func (q *SnapshotQueries) CreateBatchSnapshots(snapshots []models.Snapshot) error {
	query := `INSERT INTO snapshot (id, build_id, name, variant, target, url) VALUES (:id, :build_id, :name, :variant, :target, :url)`

	_, err := q.NamedExec(query, snapshots)

	return err
}
