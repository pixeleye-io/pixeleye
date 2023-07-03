package routes

// func QueueRoute(a *fiber.App, channelRabbitMQ *amqp.Channel) {

// 	a.Get("/queue", func(c *fiber.Ctx) error {

// 		broker.SendToQueue(channelRabbitMQ, "test-queue", "test message", brokerTypes.BuildUpdate)

// 		return c.Status(fiber.StatusOK).JSON(fiber.Map{
// 			"msg": "message queued",
// 		})
// 	})
// }
