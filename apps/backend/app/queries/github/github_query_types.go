package Github_queries

import (
	"context"

	"github.com/jmoiron/sqlx"
)

type GithubQueries struct {
	*sqlx.DB
}

type GithubQueriesTx struct {
	*sqlx.Tx
}

func NewGithubTx(db *sqlx.DB, ctx context.Context) (*GithubQueriesTx, error) {
	tx, err := db.BeginTxx(ctx, nil)

	if err != nil {
		return nil, err
	}

	return &GithubQueriesTx{tx}, nil
}
