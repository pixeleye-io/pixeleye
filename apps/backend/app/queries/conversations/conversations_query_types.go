package conversation_queries

import (
	"github.com/jmoiron/sqlx"
)

type SnapshotQueries struct {
	*sqlx.DB
}
