package conversation_queries

import (
	"github.com/jmoiron/sqlx"
)

type ConversationQueries struct {
	*sqlx.DB
}
