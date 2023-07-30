package ingest

import (
	"encoding/json"
	"os"
	"os/signal"

	"github.com/pixeleye-io/pixeleye/app/processors"
	"github.com/pixeleye-io/pixeleye/platform/broker"
	"github.com/pixeleye-io/pixeleye/platform/brokerTypes"
	"github.com/rs/zerolog/log"
)

// StartServerWithGracefulShutdown function for starting server with a graceful shutdown.
func StartIngestServerWithGracefulShutdown() {

	quitIngest := make(chan bool)

	// TODO - Test handling large queues

	startIngestServer(quitIngest)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt)

	<-quit

	quitIngest <- true

}

// StartServer func for starting a simple server.
func StartIngestServer() {
	quit := make(chan bool)

	// TODO - Test handling large queues
	startIngestServer(quit)
}

// StartIngestServer starts the ingest server.
func startIngestServer(quit chan bool) {
	// Create rabbitmq
	connection := broker.GetConnection()
	defer broker.Close()

	// Start server
	go func(quit chan bool) {
		err := broker.SubscribeToQueue(connection, "", brokerTypes.BuildProcess, func(msg []byte) error {
			log.Info().Msgf("Received a message: %s", string(msg))

			snapshotIDs := []string{}

			json.Unmarshal(msg, &snapshotIDs)

			err := processors.IngestSnapshots(snapshotIDs)

			if err != nil {
				log.Error().Err(err).Msg("Error while ingesting snapshots")
			}

			return nil
		}, quit)

		log.Fatal().Err(err).Msg("Error while subscribing to queue, shutting down")

	}(quit)

	// Wait for quit
	<-quit

}
