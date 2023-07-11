package controllers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/pixeleye-io/pixeleye/platform/session"
)

func GetCurrentUser(c *fiber.Ctx) error {

	// Get user from session.
	user, err := session.GetUser(c)

	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": "session not found",
		})
	}

	return c.JSON(user)
}
