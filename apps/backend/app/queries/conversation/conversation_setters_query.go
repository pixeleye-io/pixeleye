package conversation_queries

import (
	"context"

	"github.com/pixeleye-io/pixeleye/app/models"
)

func (q *ConversationQueries) CreateConversation(ctx context.Context, conversation *models.Conversation) error {
	query := `INSERT INTO snapshot_conversation (id, snapshot_id, x, y created_at, updated_at) VALUES (:id, :snapshot_id, :x,, :y, :created_at, :updated_at) RETURNING *`

	rows, err := q.NamedQueryContext(ctx, query, conversation)
	if err != nil {
		return err
	}

	if rows.Next() {
		return rows.StructScan(conversation)
	}

	return nil
}

func (q *ConversationQueries) CreateConversationMessage(ctx context.Context, message *models.ConversationMessage) error {
	query := `INSERT INTO snapshot_conversation_message (id, conversation_id, author_id, content, created_at) VALUES (:id, :conversation_id, :author_id, :content, :created_at) RETURNING *`

	rows, err := q.NamedQueryContext(ctx, query, message)
	if err != nil {
		return err
	}

	if rows.Next() {
		return rows.StructScan(message)
	}

	return nil
}
