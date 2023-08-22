package snapshot_queries

import (
	"context"

	"github.com/jmoiron/sqlx"
	"github.com/pixeleye-io/pixeleye/app/models"
)

func (tx *SnapshotQueriesTx) GetSnapshotsForUpdate(ctx context.Context, ids []string) ([]models.Snapshot, error) {
	snapshots := []models.Snapshot{}

	query, args, err := sqlx.In(`SELECT * FROM snapshot WHERE id IN (?)`, ids)

	if err != nil {
		return nil, err
	}

	query = tx.Rebind(query)

	err = tx.SelectContext(ctx, &snapshots, query, args...)

	return snapshots, err
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

func (q *SnapshotQueries) GetSnapshotsByBuild(buildID string) ([]models.Snapshot, error) {
	snapshots := []models.Snapshot{}

	query := `SELECT * FROM snapshot WHERE build_id = $1`

	err := q.Select(&snapshots, query, buildID)

	return snapshots, err
}
