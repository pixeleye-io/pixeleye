package controllers

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/pixeleye-io/pixeleye/app/queries"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/pixeleye-io/pixeleye/platform/cache"
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
			"data":    err.Error(),
		})
	}

	client := provider.Client(c.Context(), token)

	response, err := client.Get("https://api.github.com/user")

	if err != nil || !(response.StatusCode >= 200 && response.StatusCode < 300) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "failed to get user info",
		})
	}

	type GithubUser struct {
		ID        int    `json:"id"`
		AvatarURL string `json:"avatar_url"`
		Name      string `json:"name"`
		Email     string `json:"email"`
	}

	defer response.Body.Close()

	body, err := ioutil.ReadAll(response.Body)

	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "failed to get user info",
			"data":    err.Error(),
		})
	}

	user := GithubUser{}

	if err := json.Unmarshal(body, &user); err != nil { // Parse []byte to go struct pointer
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "failed to get user info",
			"data":    err.Error(),
		})
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	accountInfo := queries.AccountInfo{
		ID:     strconv.Itoa(user.ID),
		Name:   user.Name,
		Avatar: user.AvatarURL,
		Email:  user.Email,
	}

	dbUser, err := db.UpsertAccount(*token, accountInfo, providerName)

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	// Generate a new pair of access and refresh tokens.
	tokens, err := utils.GenerateNewTokens(dbUser.ID.String(), []string{})
	if err != nil {
		// Return status 500 and token generation error.
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	// Define user ID.
	userID := dbUser.ID.String()

	// Create a new Redis connection.
	connRedis, err := cache.RedisConnection()
	if err != nil {
		// Return status 500 and Redis connection error.
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	// Define refresh token TTL.
	ttl, err := strconv.Atoi(os.Getenv("JWT_REFRESH_KEY_EXPIRE_HOURS_COUNT"))

	// Save refresh token to Redis.
	errSaveToRedis := connRedis.Set(context.Background(), userID, tokens.Refresh, time.Duration(ttl)*time.Hour).Err()
	if errSaveToRedis != nil {
		// Return status 500 and Redis connection error.
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": errSaveToRedis.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"access":  tokens.Access,
		"refresh": tokens.Refresh,
	})
}
