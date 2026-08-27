package bitbucket_queries

import (
	"context"
	"time"

	nanoid "github.com/matoous/go-nanoid/v2"

	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
)

// InstallationParams carries the fields that differ between Bitbucket Cloud (OAuth tokens,
// no base URL) and Bitbucket Server (access token only, plus a base URL) installations.
type InstallationParams struct {
	Type           string
	InstallationID string
	TeamID         string
	AccessToken    *string
	RefreshToken   *string
	TokenExpiresAt *time.Time
	BaseURL        *string
}

func (q *BitbucketQueriesTx) CreateBitbucketInstallation(ctx context.Context, params InstallationParams) (models.GitInstallation, error) {
	query := `INSERT INTO git_installation (id, created_at, updated_at, team_id, type, installation_id, access_token, refresh_token, token_expires_at, base_url)
	VALUES (:id, :created_at, :updated_at, :team_id, :type, :installation_id, :access_token, :refresh_token, :token_expires_at, :base_url)`

	id, err := nanoid.New()
	if err != nil {
		return models.GitInstallation{}, err
	}

	now := utils.CurrentTime()

	installation := models.GitInstallation{
		ID:             id,
		CreatedAt:      now,
		UpdatedAt:      now,
		TeamID:         params.TeamID,
		Type:           params.Type,
		InstallationID: params.InstallationID,
		AccessToken:    params.AccessToken,
		RefreshToken:   params.RefreshToken,
		TokenExpiresAt: params.TokenExpiresAt,
		BaseURL:        params.BaseURL,
	}

	validate := utils.NewValidator()
	if err := validate.Struct(installation); err != nil {
		return models.GitInstallation{}, err
	}

	if _, err := q.NamedExecContext(ctx, query, installation); err != nil {
		return models.GitInstallation{}, err
	}

	return installation, nil
}

func (q *BitbucketQueriesTx) UpdateBitbucketInstallation(ctx context.Context, installation *models.GitInstallation) error {
	query := `UPDATE git_installation SET installation_id = :installation_id, access_token = :access_token, refresh_token = :refresh_token, token_expires_at = :token_expires_at, base_url = :base_url, updated_at = :updated_at WHERE id = :id`

	installation.UpdatedAt = utils.CurrentTime()

	validate := utils.NewValidator()
	if err := validate.Struct(installation); err != nil {
		return err
	}

	if _, err := q.NamedExecContext(ctx, query, installation); err != nil {
		return err
	}

	return nil
}

// UpdateBitbucketInstallationTokens updates just the OAuth token fields, used after a
// Bitbucket Cloud token refresh.
func (q *BitbucketQueries) UpdateBitbucketInstallationTokens(ctx context.Context, installation *models.GitInstallation) error {
	query := `UPDATE git_installation SET access_token = :access_token, refresh_token = :refresh_token, token_expires_at = :token_expires_at, updated_at = :updated_at WHERE id = :id`

	installation.UpdatedAt = utils.CurrentTime()

	if _, err := q.NamedExecContext(ctx, query, installation); err != nil {
		return err
	}

	return nil
}
