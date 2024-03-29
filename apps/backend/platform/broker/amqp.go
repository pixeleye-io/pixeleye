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

func ConnectAMPQ(url string) (*amqp.Connection, error) {
	// Define RabbitMQ server URL.

	// Create a new RabbitMQ connection.
	connectRabbitMQ, err := amqp.DialConfig(url, amqp.Config{
		Heartbeat: 0,
	})

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
	case brokerTypes.ProjectUpdate:
		return false
	}
	return false
}

func getQueueAutoDelete(t brokerTypes.QueueType) bool {
	switch t {
	case brokerTypes.BuildProcess:
		return false
	case brokerTypes.ProjectUpdate:
		return true
	}
	return false
}

func getMandatory(t brokerTypes.QueueType) bool {
	switch t {
	case brokerTypes.BuildProcess:
		return true
	case brokerTypes.ProjectUpdate:
		return false
	}
	return false
}

func getExchangeType(t brokerTypes.QueueType) string {
	switch t {
	case brokerTypes.BuildProcess:
		return "topic"
	case brokerTypes.ProjectUpdate:
		return "fanout"
	}
	return "topic"
}

func getQueueName(queueType brokerTypes.QueueType, name string) string {
	queueName, err := queueType.String()

	if err != nil {
		log.Fatal().Err(err).Msg("Failed to get queue name")
	}

	if name == "" {
		return queueName
	}

	return fmt.Sprintf("%s:%s", queueName, name)
}

func getQueue(channelRabbitMQ *amqp.Channel, name string, queueType brokerTypes.QueueType) amqp.Queue {
	// Get queue name.
	queueName := getQueueName(queueType, name)

	args := make(amqp.Table)
	args["x-queue-type"] = "quorum"

	if getQueueAutoDelete(queueType) {
		args["x-expires"] = 1000
	}

	// Create a new queue.
	queue, err := channelRabbitMQ.QueueDeclare(
		queueName, // queue name
		true,      // durable
		false,     // delete when unused
		false,     // exclusive
		false,     // no-wait
		args,      // arguments
	)

	if err != nil {
		log.Fatal().Err(err).Msg("Failed to declare a queue")
	}

	return queue
}
func CreateExchange(channelRabbitMQ *amqp.Channel, queueType brokerTypes.QueueType, queueName string) error {
	// Get queue name.
	exchangeName, err := getExchangeName(queueType, queueName)

	if err != nil {
		log.Fatal().Err(err).Msg("Failed to get queue name")
	}

	if exchangeName == "" {
		return nil
	}

	// Create a new queue.
	err = channelRabbitMQ.ExchangeDeclare(
		exchangeName,                  // queue name
		getExchangeType(queueType),    // type
		getQueueDurability(queueType), // durable
		getQueueAutoDelete(queueType), // delete when unused
		false,                         // internal
		false,                         // no-wait
		nil,                           // arguments
	)

	if err != nil {
		log.Error().Err(err).Msg("Failed to declare an exchange")
	}

	return err
}

func getDeliveryMode(queueType brokerTypes.QueueType) uint8 {
	switch queueType {
	case brokerTypes.BuildProcess:
		return amqp.Persistent
	case brokerTypes.ProjectUpdate:
		return amqp.Transient
	}
	return amqp.Transient
}

func getExchangeName(queueType brokerTypes.QueueType, queueName string) (string, error) {

	switch queueType {
	case brokerTypes.BuildProcess:
		return "", nil
	case brokerTypes.ProjectUpdate:
		str, err := queueType.String()
		if queueName == "" {
			return str, err
		}
		return str + ":" + queueName, err
	default:
		return "", fmt.Errorf("queue type '%v' is not supported", queueType)
	}
}

func SendToQueue(channelRabbitMQ *amqp.Channel, name string, queueType brokerTypes.QueueType, body []byte) error {

	// Create exchange.
	if err := CreateExchange(channelRabbitMQ, queueType, name); err != nil {
		return err
	}

	exchangeName, err := getExchangeName(queueType, name)
	if err != nil {
		return err
	}

	// Get queue.
	queue := getQueue(channelRabbitMQ, name, queueType)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Publish a message.
	return channelRabbitMQ.PublishWithContext(ctx,
		exchangeName,            // exchange
		queue.Name,              // routing key
		getMandatory(queueType), // mandatory
		false,                   // immediate
		amqp.Publishing{
			DeliveryMode: getDeliveryMode(queueType), // delivery mode - persistent or not
			ContentType:  "application/json",         // content type
			Body:         []byte(body),               // body
		},
	)
}

func getAutoAck(queueType brokerTypes.QueueType) bool {
	switch queueType {
	case brokerTypes.BuildProcess:
		return false
	case brokerTypes.ProjectUpdate:
		return true
	}
	return true
}

func SubscribeToQueue(connection *amqp.Connection, name string, queueType brokerTypes.QueueType, callback func([]byte) error, maxGoroutines int, quit chan bool) error {

	// Create a new channel.
	channel, err := GetChannel("consume")

	if err != nil {
		return err
	}

	if err := CreateExchange(channel, queueType, name); err != nil {
		return err
	}

	exchangeName, err := getExchangeName(queueType, name)

	if err != nil {
		return err
	}

	consumer := uuid.New().String()

	// Get queue.
	var queue amqp.Queue
	if exchangeName == "" {
		queue = getQueue(channel, name, queueType)
	} else {
		queue = getQueue(channel, name+consumer, queueType)
	}

	if exchangeName != "" {
		if err := channel.QueueBind(
			queue.Name, // queue name
			queue.Name,
			exchangeName, // exchange
			false,
			nil,
		); err != nil {
			return err
		}
	}

	autoAck := getAutoAck(queueType)

	if err := channel.Qos(maxGoroutines, 0, false); err != nil {
		return err
	}

	// Create a new consumer.
	messages, err := channel.Consume(
		queue.Name, // queue
		consumer,   // consumer
		autoAck,    // auto-ack
		false,      // exclusive
		false,      // no-local
		false,      // no-wait
		nil,        // arguments
	)

	if err != nil {
		return err
	}

	go func(messages <-chan amqp.Delivery) {

		for message := range messages {
			go func(message amqp.Delivery) {
				defer func() {
					if err := recover(); err != nil {
						log.Error().Msgf("Recovered from panic in consumer: %v", message)
						requeue := false
						if queueType == brokerTypes.BuildProcess {
							requeue = true
						}
						if err := message.Reject(requeue); err != nil {
							log.Error().Err(err).Msg("Failed to reject message")
						}
					}
				}()

				if err := callback(message.Body); err != nil {
					log.Error().Err(err).Msg("Failed to process message")
				}
				if !autoAck {
					if err := message.Ack(false); err != nil {
						log.Error().Err(err).Msg("Failed to ack message")
					}
				}

			}(message)
		}
	}(messages)

	<-quit

	fmt.Println(("Channel closed"))

	return channel.Cancel(consumer, false)
}
