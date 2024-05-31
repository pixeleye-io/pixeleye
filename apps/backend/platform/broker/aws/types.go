package broker_sqs

import (
	"context"
	"os"

	"github.com/pixeleye-io/pixeleye/platform/broker"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
)

type handler struct {
	sqs *sqs.Client

	ingestQueueURL string
}

func NewHandler() (broker.Handler, error) {

	sdkConfig, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		return nil, err
	}

	client := sqs.NewFromConfig(sdkConfig)

	return &handler{
		sqs:            client,
		ingestQueueURL: os.Getenv("SQS_INGEST_QUEUE_URL"),
	}, nil
}
