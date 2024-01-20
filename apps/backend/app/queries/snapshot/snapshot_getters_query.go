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
		  snap.created_at,
		  0 AS depth 
		FROM 
		  snapshot snap 
		WHERE 
		  snap.id = $1
		UNION ALL 
		  -- Recursive query: Join with build table to get the parent build, then join with snapshot table to get the parent snapshot
		SELECT 
		  s.id, 
		  s.build_id, 
		  s.name, 
		  s.variant, 
		  s.target, 
		  s.viewport, 
		  s.status, 
		  s.snap_image_id,
		  s.created_at,
		  f.depth + 1 
		FROM 
		  snapshot s
		  INNER JOIN build_history bh ON bh.child_id = s.build_id
		  INNER JOIN build b ON b.id = bh.parent_id
		  INNER JOIN find_approved_snapshot f ON f.build_id = b.id

		WHERE 

		  b.status NOT in ('aborted', 'failed')

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
		or status = 'missing_baseline' 
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

func (q *SnapshotQueries) GetSnapshotsByBuild(ctx context.Context, buildID string) ([]models.Snapshot, error) {
	snapshots := []models.Snapshot{}

	query := `SELECT * FROM snapshot WHERE build_id = $1`

	err := q.SelectContext(ctx, &snapshots, query, buildID)

	return snapshots, err
}

func (q *SnapshotQueries) GetUnreviewedSnapshotsByBuild(ctx context.Context, buildID string) ([]models.Snapshot, error) {
	snapshots := []models.Snapshot{}

	query := `SELECT * FROM snapshot WHERE status = 'unreviewed' AND build_id = $1`

	err := q.SelectContext(ctx, &snapshots, query, buildID)

	return snapshots, err
}

func (q *SnapshotQueries) GetReviewableSnapshotsByBuild(ctx context.Context, buildID string) ([]models.Snapshot, error) {
	snapshots := []models.Snapshot{}

	query := `SELECT * FROM snapshot WHERE (status = 'unreviewed' or status = 'approved' or status = 'rejected') AND build_id = $1`

	err := q.SelectContext(ctx, &snapshots, query, buildID)

	return snapshots, err
}
