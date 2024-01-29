package conversation_queries

import (
	"context"

	"github.com/pixeleye-io/pixeleye/app/models"
)

func (q *ConversationQueries) GetSnapshotsConversationsWithMessages(ctx context.Context, snapshotID string) ([]models.ConversationWithMessages, error) {

	conversations := []models.ConversationWithMessages{}

	query := `SELECT snapshot_conversation.*, snapshot_conversation_message.* FROM snapshot_conversation JOIN snapshot_conversation_message ON conversation_id.id = snapshot_conversation_message.conversation_id WHERE snapshot_conversation.snapshot_id = $1`

	type QueryData struct {
		*models.Conversation
		*models.ConversationMessage
	}

	var queryData []QueryData

	if err := q.GetContext(ctx, &queryData, query, snapshotID); err != nil {
		return nil, err
	}

	for _, data := range queryData {

		found := false
		for i, conversation := range conversations {
			if conversation.ID == data.Conversation.ID {
				conversations[i].Messages = append(conversations[i].Messages, *data.ConversationMessage)
				found = true
				break
			}
		}

		if !found {
			conversations = append(conversations, models.ConversationWithMessages{
				Conversation: *data.Conversation,
				Messages:     []models.ConversationMessage{*data.ConversationMessage},
			})
		}

	}

	return conversations, nil
}
