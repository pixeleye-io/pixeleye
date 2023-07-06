package controllers

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/pixeleye-io/pixeleye/app/queries"
	"github.com/pixeleye-io/pixeleye/platform/database"
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
		Name:     "oauth_state",
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
	cookie := c.Cookies("oauth_state")

	return cookie
}

func getProviders() map[string]*oauth2.Config {
	return map[string]*oauth2.Config{
		"github": {
			RedirectURL: "http://localhost:5000/api/v1/auth/callback/github",
			Endpoint: oauth2.Endpoint{
				AuthURL:  "https://github.com/login/oauth/authorize",
				TokenURL: "https://github.com/login/oauth/access_token",
			},
			ClientID:     os.Getenv("GITHUB_CLIENT_ID"),
			ClientSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
		},
	}
}

func LoginProvider(c *fiber.Ctx) error {

	var providers = getProviders()

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

	var providers = getProviders()

	cookie := getState(c)

	fmt.Println(cookie)

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

	response, err := client.Get("https://api.github.com/user")

	if err != nil || !(response.StatusCode >= 200 && response.StatusCode < 300) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "failed to get user info",
		})
	}

	defer response.Body.Close()

	type GithubUser struct {
		ID        string `json:"id"`
		AvatarURL string `json:"avatar_url"`
		Name      string `json:"name"`
		Email     string `json:"email"`
	}

	user := GithubUser{}

	err = json.NewDecoder(response.Body).Decode(&user)

	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "failed to get user info",
		})
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	accountInfo := queries.AccountInfo{
		ID:     user.ID,
		Name:   user.Name,
		Avatar: user.AvatarURL,
		Email:  user.Email,
	}

	err = db.UpsertAccount(*token, accountInfo, providerName)

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "success",
		"data":    user,
	})
}
