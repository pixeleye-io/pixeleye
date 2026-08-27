package git_bitbucketserver

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/platform/database"
)

// BitbucketServerClient talks to a single self-hosted Bitbucket Server (Data Center)
// instance using a long-lived HTTP access token (PAT) — there's no OAuth "App install"
// concept to mirror here, so unlike GitHub/Bitbucket Cloud there's nothing to refresh.
type BitbucketServerClient struct {
	httpClient *http.Client
	BaseURL    string
}

func NewClient(baseURL, accessToken string) *BitbucketServerClient {
	return &BitbucketServerClient{
		BaseURL:    strings.TrimRight(baseURL, "/"),
		httpClient: &http.Client{Transport: &bearerTransport{token: accessToken}},
	}
}

// NewBitbucketServerClient builds a client for a stored team installation.
func NewBitbucketServerClient(ctx context.Context, teamID string) (*BitbucketServerClient, error) {
	db, err := database.OpenDBConnection()
	if err != nil {
		return nil, err
	}

	installation, err := db.GetGitInstallation(ctx, teamID, models.TEAM_TYPE_BITBUCKET_SERVER)
	if err != nil {
		return nil, err
	}

	if installation.AccessToken == nil || installation.BaseURL == nil {
		return nil, fmt.Errorf("bitbucket server installation %s is missing token/base url", installation.ID)
	}

	return NewClient(*installation.BaseURL, *installation.AccessToken), nil
}

type bearerTransport struct {
	token string
}

func (t *bearerTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	req = req.Clone(req.Context())
	req.Header.Set("Authorization", "Bearer "+t.token)
	return http.DefaultTransport.RoundTrip(req)
}

func (c *BitbucketServerClient) get(ctx context.Context, path string, out interface{}) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.BaseURL+path, nil)
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
		return fmt.Errorf("bitbucket server request to %s failed: %s: %s", path, resp.Status, string(body))
	}

	return json.Unmarshal(body, out)
}

func (c *BitbucketServerClient) post(ctx context.Context, path string, payload interface{}) error {
	buf, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.BaseURL+path, bytes.NewReader(buf))
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
		return fmt.Errorf("bitbucket server request to %s failed: %s: %s", path, resp.Status, string(body))
	}

	return nil
}

// ValidateToken confirms the base URL + token are usable before we persist them.
func (c *BitbucketServerClient) ValidateToken(ctx context.Context) error {
	var props map[string]interface{}
	return c.get(ctx, "/rest/api/1.0/application-properties", &props)
}
