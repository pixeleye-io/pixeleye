package bitbucket_queries

import (
	"context"

	"github.com/jmoiron/sqlx"
)

type BitbucketQueries struct {
	*sqlx.DB
}

type BitbucketQueriesTx struct {
	*sqlx.Tx
}

func NewBitbucketTx(db *sqlx.DB, ctx context.Context) (*BitbucketQueriesTx, error) {
	tx, err := db.BeginTxx(ctx, nil)

	if err != nil {
		return nil, err
	}

	return &BitbucketQueriesTx{tx}, nil
}
