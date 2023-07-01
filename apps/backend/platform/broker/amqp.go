package broker

import (
	"fmt"

	"github.com/pixeleye/pixeleye/pkg/utils"

	amqp "github.com/rabbitmq/amqp091-go"
)

func ConnectAMPQ() *amqp.Connection {
	// Define RabbitMQ server URL.
	amqpServerURL, err := utils.ConnectionURLBuilder("amqp")

	utils.FailOnError(err, "Failed to get AMQP server URL")

	// Create a new RabbitMQ connection.
	connectRabbitMQ, err := amqp.Dial(amqpServerURL)

	utils.FailOnError(err, "Failed to connect to RabbitMQ")

	return connectRabbitMQ
}

func CreateChannel(connectRabbitMQ *amqp.Connection) *amqp.Channel {
	// Create a new channel.
	channelRabbitMQ, err := connectRabbitMQ.Channel()

	utils.FailOnError(err, "Failed to open a channel")

	return channelRabbitMQ
}

type QueueType int

const (
	BuildUpdate QueueType = iota
	BuildProcess
)

func (t QueueType) String() (string, error) {
	switch t {
	case BuildProcess:
		return "build_process", nil
	case BuildUpdate:
		return "build_update", nil
	}
	return "", fmt.Errorf("queue type '%v' is not supported", t)
}

func getQueueDurability(queueType QueueType) bool {
	switch queueType {
	case BuildProcess:
		return true
	case BuildUpdate:
		return false
	}
	return false
}

func getQueueAutoDelete(queueType QueueType) bool {
	switch queueType {
	case BuildProcess:
		return false
	case BuildUpdate:
		return true
	}
	return false
}

func getMandatory(queueType QueueType) bool {
	switch queueType {
	case BuildProcess:
		return true
	case BuildUpdate:
		return false
	}
	return false
}

func getQueueName(queueType QueueType, name string) string {
	queueName, err := queueType.String()

	utils.FailOnError(err, "Failed to get queue name")

	return fmt.Sprintf("%s:%s", queueName, name)
}

func getQueue(channelRabbitMQ *amqp.Channel, name string, queueType QueueType) amqp.Queue {
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

	utils.FailOnError(err, "Failed to declare a queue")

	return queue
}

func SendToQueue(channelRabbitMQ *amqp.Channel, name string, body string, queueType QueueType) {

	// Get queue.
	queue := getQueue(channelRabbitMQ, name, queueType)

	// Publish a message.
	err := channelRabbitMQ.Publish(
		"",                      // exchange
		queue.Name,              // routing key
		getMandatory(queueType), // mandatory
		false,                   // immediate
		amqp.Publishing{
			ContentType: "application/json", // content type //TODO convert to protobuf
			Body:        []byte(body),       // body
		},
	)

	utils.FailOnError(err, "Failed to publish a message")
}

func SubscribeToQueue(channelRabbitMQ *amqp.Channel, name string, queueType QueueType) <-chan amqp.Delivery {
	// Get queue.
	queue := getQueue(channelRabbitMQ, name, queueType)

	// Create a new consumer.
	consumer, err := channelRabbitMQ.Consume(
		queue.Name, // queue
		"",         // consumer
		true,       // auto-ack
		false,      // exclusive
		false,      // no-local
		false,      // no-wait
		nil,        // arguments
	)

	utils.FailOnError(err, "Failed to register a consumer")

	return consumer
}
