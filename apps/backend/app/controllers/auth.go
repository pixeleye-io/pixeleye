package controllers

import (
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"time"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/oauth2"
)

// AuthController struct for auth controller.
func generateStateCookie() (fiber.Cookie, error) {
	var expiration = time.Now().Add(15 * time.Minute)

	bytes := make([]byte, 16)

	_, err := rand.Read(bytes)

	if err != nil {
		return fiber.Cookie{}, err
	}

	state := base64.URLEncoding.EncodeToString(bytes)
	cookie := fiber.Cookie{
		Name:     "__Host-oauth_state",
		Value:    state,
		Expires:  expiration,
		HTTPOnly: true,
		SameSite: fiber.CookieSameSiteLaxMode,
		Secure:   true,
		Path:     "/",
	}

	return cookie, nil
}

func getState(c *fiber.Ctx) string {
	cookie := c.Cookies("__Host-oauth_state")

	return cookie
}

var providers = map[string]*oauth2.Config{
	"github": {
		RedirectURL: "http://localhost:3000/auth/google/callback",
	},
}

func LoginProvider(c *fiber.Ctx) error {

	providerName := c.Params("provider")

	provider, ok := providers[providerName]

	if !ok {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Invalid provider",
		})
	}

	cookie, err := generateStateCookie()

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	c.Cookie(&cookie)

	return c.Redirect(provider.AuthCodeURL(cookie.Value), http.StatusTemporaryRedirect)

}

func LoginCallback(c *fiber.Ctx) error {

	cookie := getState(c)

	if cookie != c.Query("state") {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": "invalid state parameter",
		})
	}

	providerName := c.Params("provider")

	provider, ok := providers[providerName]

	if !ok {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid provider",
		})
	}

	token, err := provider.Exchange(c.Context(), c.Query("code"))

	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "code exchange failed",
		})
	}

	client := provider.Client(c.Context(), token)

	response, err := client.Get("https://www.googleapis.com/oauth2/v3/userinfo")

	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "failed to get user info",
		})
	}

	defer response.Body.Close()

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "success",
	})
}
