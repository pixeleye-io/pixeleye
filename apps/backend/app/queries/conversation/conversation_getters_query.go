package conversation_queries

import (
	"context"

	"github.com/pixeleye-io/pixeleye/app/models"
)

func (q *ConversationQueries) GetConversationWithMessages(ctx context.Context, id string) (*models.ConversationWithMessages, error) {
	conversation := models.Conversation{}

	queryConversation := `SELECT * FROM snapshot_conversation WHERE id = $1`
	queryMessages := `SELECT * FROM snapshot_conversation_message WHERE conversation_id = $1 ORDER BY created_at ASC`

	err := q.GetContext(ctx, &conversation, queryConversation, id)
	if err != nil {
		return nil, err
	}

	messages := []models.ConversationMessage{}
	err = q.SelectContext(ctx, &messages, queryMessages, id)
	if err != nil {
		return nil, err
	}

	return &models.ConversationWithMessages{
		Conversation: conversation,
		Messages:     messages,
	}, nil
}
