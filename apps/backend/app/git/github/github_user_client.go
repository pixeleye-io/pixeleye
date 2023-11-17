package git_github

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/google/go-github/v56/github"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/platform/database"
	"github.com/rs/zerolog/log"
)

type GithubUserClient struct {
	*github.Client
}

type GithubRefreshTokenResponse struct {
	AccessToken           string `json:"access_token"`
	ExpiresIn             int    `json:"expires_in"`
	RefreshToken          string `json:"refresh_token"`
	RefreshTokenExpiresIn int    `json:"refresh_token_expires_in"`
	TokenType             string `json:"token_type"`
	Scope                 string `json:"scope"`
}

func RefreshGithubTokens(ctx context.Context, refreshToken string) (*GithubRefreshTokenResponse, error) {
	clientID := os.Getenv("GITHUB_APP_CLIENT_ID")
	clientSecret := os.Getenv("GITHUB_APP_CLIENT_SECRET")

	refreshURL := fmt.Sprintf("https://github.com/login/oauth/access_token?client_id=%s&client_secret=%s&grant_type=refresh_token&refresh_token=%s", clientID, clientSecret, refreshToken)

	req, err := http.NewRequest("GET", refreshURL, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Accept", "application/json")

	resp, err := http.DefaultClient.Do(req)

	if err != nil {
		return nil, err
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	response := GithubRefreshTokenResponse{}

	if err := json.Unmarshal(body, &response); err != nil {
		return nil, err
	}

	return &response, nil
}

func NewGithubUserClient(ctx context.Context, userID string) (*GithubUserClient, error) {
	db, err := database.OpenDBConnection()

	if err != nil {
		return nil, err
	}

	githubAccount, err := db.GetUserAccountByProvider(ctx, userID, models.ACCOUNT_PROVIDER_GITHUB)
	if err != nil {
		return nil, err
	}

	// We subtract a minute from the expiry time to make sure we don't run into any issues with the token expiring before we use it
	if githubAccount.AccessTokenExpiresAt.Before(time.Now().Add(-time.Minute)) {
		if githubAccount.RefreshTokenExpiresAt.Before(time.Now().Add(-(time.Second * 10))) {
			// TODO - we need the user to re-authenticate with github, this happens every 6 months
			log.Error().Msgf("Github refresh token has expired for user %s", userID)
			return nil, fmt.Errorf("Github refresh token has expired for user %s", userID)
		}

		githubRefreshTokenResponse, err := RefreshGithubTokens(ctx, githubAccount.RefreshToken)
		if err != nil {
			return nil, err
		}

		githubAccount.AccessToken = githubRefreshTokenResponse.AccessToken
		githubAccount.AccessTokenExpiresAt = time.Now().Add(time.Second * time.Duration(githubRefreshTokenResponse.ExpiresIn))
		githubAccount.RefreshToken = githubRefreshTokenResponse.RefreshToken
		githubAccount.RefreshTokenExpiresAt = time.Now().Add(time.Second * time.Duration(githubRefreshTokenResponse.RefreshTokenExpiresIn))

		if err := db.UpdateAccount(ctx, githubAccount); err != nil {
			return nil, err
		}
	}

	client := github.NewClient(nil).WithAuthToken(githubAccount.AccessToken)
	if err != nil {
		return nil, err
	}

	return &GithubUserClient{
		Client: client,
	}, nil
}
