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
		  snap.id, 
		  snap.build_id, 
		  snap.name, 
		  snap.variant, 
		  snap.target, 
		  snap.viewport, 
		  snap.status, 
		  snap.snap_image_id,
		  0 AS depth 
		FROM 
		  snapshot snap 
		WHERE 
		  snap.id = $1
		UNION ALL 
		  -- Recursive query: Join with build_history to get the next snapshot in the build history
		SELECT 
		  s.id, 
		  s.build_id, 
		  s.name, 
		  s.variant, 
		  s.target, 
		  s.viewport, 
		  s.status, 
		  s.snap_image_id,
		  f.depth + 1 
		FROM 
		  snapshot s 
		  INNER JOIN build_history bh ON bh.parent_id = s.build_id 
		  INNER JOIN find_approved_snapshot f ON f.build_id = bh.child_id 
		WHERE 
		  s.name = f.name 
		  AND s.variant = f.variant 
		  AND s.viewport = f.viewport 
		  AND s.target = f.target
	  ) -- Final query: Select the first approved snapshot with matching name, variant, and target
	  SELECT 
		* 
	  FROM 
		find_approved_snapshot 
	  WHERE 
		status = 'approved' 
		or status = 'orphaned' 
	  ORDER BY 
		depth ASC 
	  LIMIT 
		1
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