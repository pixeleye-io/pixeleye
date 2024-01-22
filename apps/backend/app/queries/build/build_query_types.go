package build_queries

import (
	"context"

	"github.com/jmoiron/sqlx"
)

type BuildQueries struct {
	*sqlx.DB
}

type BuildQueriesTx struct {
	*sqlx.Tx
	DB *sqlx.DB
}

func NewBuildTx(db *sqlx.DB, ctx context.Context) (*BuildQueriesTx, error) {
	tx, err := db.BeginTxx(ctx, nil)

	if err != nil {
		return nil, err
	}

	return &BuildQueriesTx{
		Tx: tx,
		DB: db,
	}, nil
}
