package ingest

import (
	"context"
	"encoding/json"
	"os"
	"os/signal"

	"github.com/pixeleye-io/pixeleye/app/processors"
	statuses_build "github.com/pixeleye-io/pixeleye/app/statuses/build"
	"github.com/pixeleye-io/pixeleye/platform/broker"
	"github.com/pixeleye-io/pixeleye/platform/brokerTypes"
	"github.com/pixeleye-io/pixeleye/platform/database"
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

	startIngestServer(quit)
}

// StartIngestServer starts the ingest server.
func startIngestServer(quit chan bool) {
	// Create rabbitmq
	connection, err := broker.GetConnection("consume")
	if err != nil {
		log.Fatal().Err(err).Msg("Error while connecting to broker")
	}
	defer broker.Close("consume")

	// TODO avoid shutting down if we get an error

	// Start server
	go func(quit chan bool) {
		err := broker.SubscribeToQueue(connection, "", brokerTypes.BuildProcess, func(msg []byte) error {

			log.Info().Msgf("Received a message: %s", string(msg))

			snapshotIDs := []string{}

			if err := json.Unmarshal(msg, &snapshotIDs); err != nil {
				log.Error().Err(err).Msg("Error while unmarshalling message")
				return nil
			}

			if err := processors.IngestSnapshots(snapshotIDs); err != nil {
				log.Error().Err(err).Msg("Error while ingesting snapshots")

				// we want to blanket fail the build

				db, err := database.OpenDBConnection()
				if err != nil {
					log.Fatal().Err(err).Msg("Error while opening db connection")
					return nil
				}

				build, err := db.GetSnapshotsBuild(context.Background(), snapshotIDs[0])
				if err != nil {
					log.Fatal().Err(err).Msg("Error while getting build")
					return nil
				}

				if err := statuses_build.FailBuild(context.Background(), &build); err != nil {
					log.Fatal().Err(err).Msg("Error while failing build")
					return nil
				}
			}

			return nil
		}, 100, quit)

		if err != nil {
			log.Fatal().Err(err).Msg("Error while subscribing to queue, shutting down")
			panic(err)
		}

	}(quit)

	// Wait for quit
	<-quit
}
