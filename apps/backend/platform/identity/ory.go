package identity

import (
	"context"
	"os"

	client "github.com/ory/client-go"
)

var authed = context.WithValue(context.Background(), client.ContextAccessToken, os.Getenv("ORY_API_KEY"))

var oryClient *client.APIClient

func getOryClient() *client.APIClient {
	if oryClient != nil {
		return oryClient
	}
	cfg := client.NewConfiguration()
	cfg.Servers = client.ServerConfigurations{
		{URL: os.Getenv("ORY_ENDPOINT")},
	}

	oryClient = client.NewAPIClient(cfg)
	return oryClient
}

// Either set the user to active or inactive.
// We usually use this whilst the user is being deleted.
func SetState(userID string, active bool) error {
	state := "active"

	if !active {
		state = "inactive"
	}

	ory := getOryClient()

	_, _, err := ory.IdentityApi.
		PatchIdentity(authed, userID).
		JsonPatch([]client.JsonPatch{{Op: "replace", Path: "/state", Value: state}}).
		Execute()

	return err
}
