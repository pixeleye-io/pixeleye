package Github_queries

import (
	"context"

	nanoid "github.com/matoous/go-nanoid/v2"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
)

func (q *GithubQueriesTx) CreateGithubAppInstallation(context context.Context, installationID string, teamID string) (models.GitInstallation, error) {
	query := `INSERT INTO git_installation (installation_id, id, created_at, updated_at, team_id, type) VALUES (:installation_id, :id, :created_at, :updated_at, :team_id, :type)`

	id, err := nanoid.New()

	if err != nil {
		return models.GitInstallation{}, err
	}

	time := utils.CurrentTime()

	installation := models.GitInstallation{
		InstallationID: installationID,
		ID:             id,
		CreatedAt:      time,
		UpdatedAt:      time,
		TeamID:         teamID,
		Type:           models.GIT_TYPE_GITHUB,
	}

	validate := utils.NewValidator()

	if err := validate.Struct(installation); err != nil {
		return models.GitInstallation{}, err
	}

	if _, err := q.NamedExecContext(context, query, installation); err != nil {
		return models.GitInstallation{}, err
	}

	return installation, nil
}
