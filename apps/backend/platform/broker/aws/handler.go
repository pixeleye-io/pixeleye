package broker_sqs

import (
	"context"
	"encoding/json"

	"github.com/aws/aws-sdk-go-v2/service/sqs"
)

func (h *handler) QueueJob(ctx context.Context, topic string, message interface{}) error {

	bodyBytes, err := json.Marshal(message)
	if err != nil {
		return err
	}

	body := string(bodyBytes)

	_, err = h.sqs.SendMessage(ctx, &sqs.SendMessageInput{
		MessageBody: &body,
		QueueUrl:    &h.ingestQueueURL,
	})

	return err
}
