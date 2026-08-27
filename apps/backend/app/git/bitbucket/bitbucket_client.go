package git_bitbucket

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/platform/database"
)

const apiBaseURL = "https://api.bitbucket.org/2.0"
const oauthTokenURL = "https://bitbucket.org/site/oauth2/access_token"
const oauthAuthorizeURL = "https://bitbucket.org/site/oauth2/authorize"

// BitbucketCloudClient is an authenticated client for a single team's Bitbucket Cloud
// workspace connection. Unlike GitHub's App-installation tokens (minted on demand from a
// JWT), Bitbucket Cloud OAuth access tokens are stored and refreshed as needed.
type BitbucketCloudClient struct {
	httpClient *http.Client
}

type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	ExpiresIn    int    `json:"expires_in"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	Scopes       string `json:"scopes"`
}

func ExchangeCodeForToken(ctx context.Context, code, redirectURI string) (*TokenResponse, error) {
	return requestToken(ctx, url.Values{
		"grant_type":   {"authorization_code"},
		"code":         {code},
		"redirect_uri": {redirectURI},
	})
}

func RefreshToken(ctx context.Context, refreshToken string) (*TokenResponse, error) {
	return requestToken(ctx, url.Values{
		"grant_type":    {"refresh_token"},
		"refresh_token": {refreshToken},
	})
}

func requestToken(ctx context.Context, form url.Values) (*TokenResponse, error) {
	clientID := os.Getenv("BITBUCKET_OAUTH_CLIENT_ID")
	clientSecret := os.Getenv("BITBUCKET_OAUTH_CLIENT_SECRET")

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, oauthTokenURL, bytes.NewBufferString(form.Encode()))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")
	req.SetBasicAuth(clientID, clientSecret)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("bitbucket oauth token request failed: %s: %s", resp.Status, string(body))
	}

	var tokenResp TokenResponse
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return nil, err
	}

	return &tokenResp, nil
}

func AuthorizeURL(state, redirectURI string) string {
	clientID := os.Getenv("BITBUCKET_OAUTH_CLIENT_ID")
	return fmt.Sprintf("%s?client_id=%s&response_type=code&state=%s&redirect_uri=%s", oauthAuthorizeURL, clientID, url.QueryEscape(state), url.QueryEscape(redirectURI))
}

// NewBitbucketCloudClient builds a client for the given installation, refreshing the
// stored access token first if it's expired (or close to it).
func NewBitbucketCloudClient(ctx context.Context, installationID string) (*BitbucketCloudClient, error) {
	db, err := database.OpenDBConnection()
	if err != nil {
		return nil, err
	}

	installation, err := db.GetGitInstallationByID(ctx, installationID, models.GIT_TYPE_BITBUCKET)
	if err != nil {
		return nil, err
	}

	if installation.AccessToken == nil || installation.RefreshToken == nil {
		return nil, fmt.Errorf("bitbucket installation %s is missing stored tokens", installation.ID)
	}

	accessToken := *installation.AccessToken

	if installation.TokenExpiresAt == nil || installation.TokenExpiresAt.Before(time.Now().Add(time.Minute)) {
		refreshed, err := RefreshToken(ctx, *installation.RefreshToken)
		if err != nil {
			return nil, err
		}

		accessToken = refreshed.AccessToken
		expiresAt := time.Now().Add(time.Duration(refreshed.ExpiresIn) * time.Second)

		installation.AccessToken = &refreshed.AccessToken
		installation.RefreshToken = &refreshed.RefreshToken
		installation.TokenExpiresAt = &expiresAt

		if err := db.UpdateBitbucketInstallationTokens(ctx, &installation); err != nil {
			return nil, err
		}
	}

	return &BitbucketCloudClient{
		httpClient: &http.Client{Transport: &bearerTransport{token: accessToken}},
	}, nil
}

// NewTempClient builds a client directly from an access token, used during the OAuth
// callback before a GitInstallation row exists to look one up from.
func NewTempClient(accessToken string) *BitbucketCloudClient {
	return &BitbucketCloudClient{
		httpClient: &http.Client{Transport: &bearerTransport{token: accessToken}},
	}
}

type bearerTransport struct {
	token string
	base  http.RoundTripper
}

func (t *bearerTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	req = req.Clone(req.Context())
	req.Header.Set("Authorization", "Bearer "+t.token)

	base := t.base
	if base == nil {
		base = http.DefaultTransport
	}

	return base.RoundTrip(req)
}

// get performs a GET request. path may be a path relative to apiBaseURL (e.g.
// "/workspaces") or a full URL (as returned in a paginated response's "next" field).
func (c *BitbucketCloudClient) get(ctx context.Context, path string, out interface{}) error {
	reqURL := path
	if !strings.HasPrefix(reqURL, "http") {
		reqURL = apiBaseURL + path
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	if resp.StatusCode >= 400 {
		return fmt.Errorf("bitbucket api request to %s failed: %s: %s", reqURL, resp.Status, string(body))
	}

	return json.Unmarshal(body, out)
}

func (c *BitbucketCloudClient) post(ctx context.Context, path string, payload interface{}) error {
	buf, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, apiBaseURL+path, bytes.NewReader(buf))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	if resp.StatusCode >= 400 {
		return fmt.Errorf("bitbucket api request to %s failed: %s: %s", path, resp.Status, string(body))
	}

	return nil
}
