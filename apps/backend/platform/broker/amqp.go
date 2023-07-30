package broker

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/pixeleye-io/pixeleye/platform/brokerTypes"
	"github.com/rs/zerolog/log"

	amqp "github.com/rabbitmq/amqp091-go"
)

// TODO don't fail build if we can't connect to the broker

func ConnectAMPQ(url string) (*amqp.Connection, error) {
	// Define RabbitMQ server URL.

	// Create a new RabbitMQ connection.
	connectRabbitMQ, err := amqp.Dial(url)

	if err != nil {
		return nil, err
	}

	return connectRabbitMQ, nil
}

func CreateChannel(connectRabbitMQ *amqp.Connection) (*amqp.Channel, error) {
	// Create a new channel.
	channelRabbitMQ, err := connectRabbitMQ.Channel()

	return channelRabbitMQ, err
}

func getQueueDurability(t brokerTypes.QueueType) bool {
	switch t {
	case brokerTypes.BuildProcess:
		return true
	case brokerTypes.BuildUpdate:
		return false
	}
	return false
}

func getQueueAutoDelete(t brokerTypes.QueueType) bool {
	switch t {
	case brokerTypes.BuildProcess:
		return false
	case brokerTypes.BuildUpdate:
		return true
	}
	return false
}

func getMandatory(t brokerTypes.QueueType) bool {
	switch t {
	case brokerTypes.BuildProcess:
		return true
	case brokerTypes.BuildUpdate:
		return false
	}
	return false
}

func getQueueName(queueType brokerTypes.QueueType, name string) string {
	queueName, err := queueType.String()

	if err != nil {
		log.Fatal().Err(err).Msg("Failed to get queue name")
	}

	return fmt.Sprintf("%s:%s", queueName, name)
}

func getQueue(channelRabbitMQ *amqp.Channel, name string, queueType brokerTypes.QueueType) amqp.Queue {
	// Get queue name.
	queueName := getQueueName(queueType, name)

	// Create a new queue.
	queue, err := channelRabbitMQ.QueueDeclare(
		queueName,                     // queue name
		getQueueDurability(queueType), // durable
		getQueueAutoDelete(queueType), // delete when unused
		false,                         // exclusive
		false,                         // no-wait
		nil,                           // arguments
	)

	if err != nil {
		log.Fatal().Err(err).Msg("Failed to declare a queue")
	}

	return queue
}

func getDeliveryMode(queueType brokerTypes.QueueType) uint8 {
	switch queueType {
	case brokerTypes.BuildProcess:
		return amqp.Persistent
	case brokerTypes.BuildUpdate:
		return amqp.Transient
	}
	return amqp.Transient
}

func SendToQueue(channelRabbitMQ *amqp.Channel, name string, queueType brokerTypes.QueueType, body []byte) error {

	// Get queue.
	queue := getQueue(channelRabbitMQ, name, queueType)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Publish a message.
	err := channelRabbitMQ.PublishWithContext(ctx,
		"",                      // exchange
		queue.Name,              // routing key
		getMandatory(queueType), // mandatory
		false,                   // immediate
		amqp.Publishing{
			DeliveryMode: getDeliveryMode(queueType), // delivery mode - persistent or not
			ContentType:  "application/json",         // content type
			Body:         []byte(body),               // body
		},
	)

	return err
}

func SubscribeToQueue(connection *amqp.Connection, name string, queueType brokerTypes.QueueType, callback func([]byte) error, quit chan bool) error {

	// Create a new channel.
	channel := GetChannel()
	// Get queue.
	queue := getQueue(channel, name, queueType)

	consumer := uuid.New().String()

	// Create a new consumer.
	messages, err := channel.Consume(
		queue.Name, // queue
		consumer,   // consumer
		true,       // auto-ack
		false,      // exclusive
		false,      // no-local
		false,      // no-wait
		nil,        // arguments
	)

	if err != nil {
		return err
	}

	defer channel.Cancel(consumer, false)

	go func() {
		for message := range messages {
			callback(message.Body)
		}
	}()

	<-quit

	fmt.Println(("Channel closed"))

	return nil
}
