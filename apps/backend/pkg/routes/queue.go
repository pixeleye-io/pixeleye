package routes

import (
	"github.com/gofiber/fiber/v2"
	broker "github.com/pixeleye-io/pixeleye/platform/broker"
	amqp "github.com/rabbitmq/amqp091-go"
)

func QueueRoute(a *fiber.App, channelRabbitMQ *amqp.Channel) {

	a.Get("/queue", func(c *fiber.Ctx) error {

		broker.SendToQueue(channelRabbitMQ, "test-queue", "test message", broker.BuildUpdate)

		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"msg": "message queued",
		})
	})
}
