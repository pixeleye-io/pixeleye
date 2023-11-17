package identity

import (
	"context"
	"os"

	client "github.com/ory/client-go"
)

var _oryClient *client.APIClient

func getOryAdminClient() *client.APIClient {
	if _oryClient != nil {
		return _oryClient
	}
	cfg := client.NewConfiguration()
	cfg.Servers = client.ServerConfigurations{
		{URL: os.Getenv("KRATOS_ADMIN_URL")},
	}

	_oryClient = client.NewAPIClient(cfg)
	return _oryClient
}

// Either set the user to active or inactive.
// We usually use this whilst the user is being deleted.
func SetState(ctx context.Context, userID string, active bool) error {
	state := "active"

	if !active {
		state = "inactive"
	}

	ory := getOryAdminClient()

	authed := context.WithValue(ctx, client.ContextAccessToken, os.Getenv("ORY_API_KEY"))

	_, _, err := ory.IdentityAPI.
		PatchIdentity(authed, userID).
		JsonPatch([]client.JsonPatch{{Op: "replace", Path: "/state", Value: state}}).
		Execute()

	return err
}

func GetTokens(ctx context.Context, identityId string) (cl client.IdentityCredentials, err error) {

	authed := context.WithValue(ctx, client.ContextAccessToken, os.Getenv("ORY_API_KEY"))

	ory := getOryAdminClient()

	identity, _, err := ory.IdentityAPI.
		GetIdentity(authed, identityId).
		IncludeCredential([]string{"oidc"}).Execute()
	if err != nil {
		return cl, err
	}
	return (*identity.Credentials)["oidc"], nil
}
