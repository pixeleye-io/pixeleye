package Github_queries

import (
	"context"

	"github.com/pixeleye-io/pixeleye/app/models"
)

func (q *GithubQueries) GetGitInstallationByID(ctx context.Context, installationID string, gitType string) (models.GitInstallation, error) {
	query := `SELECT * FROM git_installation WHERE installation_id = $1 AND type = $2`

	installation := models.GitInstallation{}

	err := q.GetContext(ctx, &installation, query, installationID, gitType)

	if err != nil {
		return models.GitInstallation{}, err
	}

	return installation, nil
}

func (q *GithubQueries) GetGitInstallationByIDs(ctx context.Context, installationIDs []string, gitType string) ([]models.GitInstallation, error) {
	query := `SELECT * FROM git_installation WHERE installation_id = ANY($1) AND type = $2`

	installations := []models.GitInstallation{}

	err := q.SelectContext(ctx, &installations, query, installationIDs, gitType)

	if err != nil {
		return []models.GitInstallation{}, err
	}

	return installations, nil
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
