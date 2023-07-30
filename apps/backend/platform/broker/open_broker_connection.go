package broker

import (
	"github.com/pixeleye-io/pixeleye/app/queues"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/pixeleye-io/pixeleye/platform/brokerTypes"
	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/rs/zerolog/log"
)

// Queries struct for collect all app queries.
type Queues struct {
	*queues.IngestQueue
}

var globalConnection *amqp.Connection

func Close() {
	if globalConnection != nil {
		globalConnection.Close()
		globalConnection = nil
	}
}

func GetChannel() *amqp.Channel {
	connection := GetConnection()
	channel, err := connection.Channel()
	if err != nil {
		log.Error().Err(err).Msg("Failed to open a channel")

		if channel != nil {

			channel.Close()
		}
	}

	return channel
}

func GetConnection() *amqp.Connection {
	if globalConnection == nil {
		url, err := utils.ConnectionURLBuilder("amqp")
		if err != nil {
			log.Fatal().Err(err).Msg("Failed to build connection URL")
		}
		// Define a new Database connection
		globalConnection, err = ConnectAMPQ(url)
		if err != nil {
			if globalConnection != nil {
				globalConnection.Close()
				globalConnection = nil
			}
			log.Fatal().Err(err).Msg("Failed to connect to RabbitMQ")
		}
	}
	return globalConnection
}

func GetBroker() (*Queues, error) {

	channel := GetChannel()

	connection := GetConnection()

	send := func(queueType brokerTypes.QueueType, queueName string, body []byte) error {
		return SendToQueue(channel, queueName, queueType, body)
	}

	subscribe := func(queueType brokerTypes.QueueType, queueName string, callback func([]byte) error, quit chan bool) error {
		return SubscribeToQueue(connection, queueName, queueType, callback, quit)
	}

	broker := &brokerTypes.Broker{
		Send:      send,
		Subscribe: subscribe,
	}

	return &Queues{
		IngestQueue: &queues.IngestQueue{
			Broker: broker,
		},
	}, nil

}
