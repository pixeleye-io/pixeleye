package Team_queries

import (
	"context"

	"github.com/jmoiron/sqlx"
)

type TeamQueries struct {
	*sqlx.DB
}

type TeamQueriesTx struct {
	*sqlx.Tx
}

func NewTeamTx(db *sqlx.DB, ctx context.Context) (*TeamQueriesTx, error) {
	tx, err := db.BeginTxx(ctx, nil)

	if err != nil {
		return nil, err
	}

	return &TeamQueriesTx{tx}, nil
}
