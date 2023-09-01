package snapshot_queries

import (
	"context"

	"github.com/jmoiron/sqlx"
)

type SnapshotQueries struct {
	*sqlx.DB
}

type SnapshotQueriesTx struct {
	*sqlx.Tx
}

func NewSnapshotTx(db *sqlx.DB, ctx context.Context) (*SnapshotQueriesTx, error) {
	tx, err := db.BeginTxx(ctx, nil)

	if err != nil {
		return nil, err
	}

	return &SnapshotQueriesTx{tx}, nil
}
