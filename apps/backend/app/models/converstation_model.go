package models

import "time"

type Conversation struct {
	ID         string    `db:"id" json:"id" validate:"required,nanoid"`
	CreatedAt  time.Time `db:"created_at" json:"createdAt"`
	SnapshotID string    `db:"snapshot_id" json:"snapshotID" validate:"required,nanoid"`
	X          float32   `db:"x" json:"x"`
	Y          float32   `db:"y" json:"y"`
}

type ConversationMessage struct {
	ID             string    `db:"id" json:"id" validate:"required,nanoid"`
	CreatedAt      time.Time `db:"created_at" json:"createdAt"`
	ConversationID string    `db:"conversation_id" json:"conversationID" validate:"required,nanoid"`
	AuthorID       string    `db:"author_id" json:"authorID" validate:"required,nanoid"`

	Content string `db:"content" json:"content" validate:"required"`
}

type ConversationWithMessages struct {
	Conversation `json:"conversation"`
	Messages     []ConversationMessage `json:"messages"`
}
