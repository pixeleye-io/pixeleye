package routes

import "github.com/gofiber/fiber/v2"

// Ping func for pinging server.
func PingRoute(a *fiber.App) {

	a.Get("/ping", func(c *fiber.Ctx) error {
		// Return HTTP 200 status and JSON response.
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"msg": "pong",
		})
	})
}
