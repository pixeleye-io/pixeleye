package broker

import "context"

type (
	JobType string

	Handler interface {
		QueueJob(ctx context.Context, topic string, message interface{}) error
	}
)

const (
	// MessageTypeIngest is the message type for ingest messages.
	JobTypeIngest JobType = "ingest"
)
