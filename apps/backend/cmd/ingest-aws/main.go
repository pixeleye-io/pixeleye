package main

import (
	"context"
	"fmt"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/pixeleye-io/pixeleye/pkg/ingest"
	"github.com/rs/zerolog/log"
)

func handler(event events.SQSEvent) error {
	ctx := context.Background()
	for _, record := range event.Records {
		err := processMessage(ctx, record)
		if err != nil {
			return err
		}
	}
	fmt.Println("done")
	return nil
}

func processMessage(ctx context.Context, record events.SQSMessage) error {
	log.Info().Msgf("Received a message: %s", record.Body)

	return ingest.HandleMessage(ctx, []byte(record.Body))
}

func main() {
	lambda.Start(handler)
}
