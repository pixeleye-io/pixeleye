package Github_queries

import (
	"context"

	"github.com/pixeleye-io/pixeleye/app/models"
)

func (q *GithubQueries) GetGithubAppInstallation(installationID string) (models.GitInstallation, error) {
	query := `SELECT * FROM git_installation WHERE installation_id = $1`

	installation := models.GitInstallation{}

	err := q.Get(&installation, query, installationID)

	if err != nil {
		return models.GitInstallation{}, err
	}

	return installation, nil
}

func (q *GithubQueriesTx) GetGithubAPpInstallationByTeamIDForUpdate(ctx context.Context, teamID string) (models.GitInstallation, error) {
	query := `SELECT * FROM git_installation WHERE team_id = $1 FOR UPDATE`

	installation := models.GitInstallation{}

	err := q.GetContext(ctx, &installation, query, teamID)

	if err != nil {
		return models.GitInstallation{}, err
	}

	return installation, nil
}
