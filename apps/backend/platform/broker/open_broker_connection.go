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
var globalConsumeConnection *amqp.Connection

// nolint:gochecknoglobals
var globalPublishConnection *amqp.Connection

func CloseConsume() {
	if globalConsumeConnection != nil {
		globalConsumeConnection.Close()
		globalConsumeConnection = nil
	}
}

func ClosePublish() {
	if globalPublishConnection != nil {
		globalPublishConnection.Close()
		globalPublishConnection = nil
	}
}

func Close(channelType string) {
	if channelType == "consume" {
		CloseConsume()
	} else {
		ClosePublish()
	}
}

func GetChannel(channelType string) (*amqp.Channel, error) {
	connection, err := GetConnection(channelType)
	if err != nil {
		return nil, err
	}

	channel, err := connection.Channel()
	if err != nil {
		log.Error().Err(err).Msg("Failed to open a channel")
		Close(channelType)

		connection, err := GetConnection(channelType)
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

func GetConnection(channelType string) (*amqp.Connection, error) {

	var globalConnection *amqp.Connection

	if channelType == "consume" {
		globalConnection = globalConsumeConnection
	} else {
		globalConnection = globalPublishConnection
	}

	if globalConnection == nil || globalConnection.IsClosed() {
		userName := os.Getenv("AMQP_USER")
		password := os.Getenv("AMQP_PASSWORD")
		host := os.Getenv("AMQP_HOST")
		vhost := os.Getenv("AMQP_VHOST")
		port := os.Getenv("AMQP_PORT")
		tls := os.Getenv("AMQP_TLS")

		protocol := "amqp"
		if tls == "true" {
			protocol = "amqps"
		}

		url := fmt.Sprintf("%s://%s:%s@%s:%s/%s", protocol, userName, password, host, port, vhost)

		log.Info().Msgf("Connecting to RabbitMQ")

		// Define a new Database connection
		var err error
		globalConnection, err = ConnectAMPQ(url)
		if err != nil {
			log.Fatal().Err(err).Msg("Failed to connect to RabbitMQ")
			return nil, err
		}

		if channelType == "consume" {
			globalConsumeConnection = globalConnection
		} else {
			globalPublishConnection = globalConnection
		}
	}

	return globalConnection, nil
}

func GetBroker() (*Queues, error) {

	channel, err := GetChannel("publish")
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
