package broker

import (
	"fmt"
	"os"

	"github.com/pixeleye-io/pixeleye/app/queues"
	"github.com/pixeleye-io/pixeleye/platform/brokerTypes"
	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/rs/zerolog/log"
)

// Queries struct for collect all app queries.
type Queues struct {
	*queues.IngestQueue
	*queues.ProjectEventQueue
}

// nolint:gochecknoglobals
var globalConnection *amqp.Connection

func Close() {
	if globalConnection != nil {
		globalConnection.Close()
		globalConnection = nil
	}
}

func GetChannel() (*amqp.Channel, error) {
	connection, err := GetConnection()
	if err != nil {
		return nil, err
	}

	channel, err := connection.Channel()
	if err != nil {
		log.Error().Err(err).Msg("Failed to open a channel")
		globalConnection.Close()
		globalConnection = nil

		connection, err := GetConnection()
		if err != nil {
			return nil, err
		}

		channel, err = connection.Channel()
		if err != nil {
			log.Error().Err(err).Msg("Failed to open a channel")
			return nil, err
		}

	}

	return channel, err
}

func GetConnection() (*amqp.Connection, error) {
	if globalConnection == nil || globalConnection.IsClosed() {
		// url := os.Getenv("AMQP_URL")

		userName := os.Getenv("AMQP_USER")
		password := os.Getenv("AMQP_PASSWORD")
		host := os.Getenv("AMQP_HOST")
		port := os.Getenv("AMQP_PORT")

		url := fmt.Sprintf("amqp://%s:%s@%s:%s/", userName, password, host, port)

		log.Info().Msgf("Connecting to RabbitMQ at %s", url)

		// Define a new Database connection
		var err error
		globalConnection, err = ConnectAMPQ(url)
		if err != nil {
			log.Fatal().Err(err).Msg("Failed to connect to RabbitMQ")
			return nil, err
		}
	}

	return globalConnection, nil
}

func GetBroker() (*Queues, error) {

	channel, err := GetChannel()
	if err != nil {
		return nil, err
	}

	send := func(queueType brokerTypes.QueueType, queueName string, body []byte) error {
		return SendToQueue(channel, queueName, queueType, body)
	}

	broker := &brokerTypes.Broker{
		Send: send,
	}

	return &Queues{
		IngestQueue: &queues.IngestQueue{
			Broker: broker,
		},
		ProjectEventQueue: &queues.ProjectEventQueue{
			Broker: broker,
		},
	}, nil

}
