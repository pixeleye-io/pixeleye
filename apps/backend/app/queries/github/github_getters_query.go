package Github_queries

import (
	"context"

	"github.com/jmoiron/sqlx"
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
	query := `SELECT * FROM git_installation WHERE type = ? AND installation_id IN (?)`

	if len(installationIDs) == 0 {
		return []models.GitInstallation{}, nil
	}

	query, args, err := sqlx.In(query, gitType, installationIDs)

	if err != nil {
		return []models.GitInstallation{}, err
	}

	query = q.Rebind(query)

	installations := []models.GitInstallation{}

	if err := q.SelectContext(ctx, &installations, query, args...); err != nil {
		return []models.GitInstallation{}, err
	}

	return installations, nil
}

func (q *GithubQueriesTx) GetGithubAppInstallationByTeamIDForUpdate(ctx context.Context, teamID string) (models.GitInstallation, error) {
	query := `SELECT * FROM git_installation WHERE team_id = $1 FOR UPDATE`

	installation := models.GitInstallation{}

	err := q.GetContext(ctx, &installation, query, teamID)

	if err != nil {
		return models.GitInstallation{}, err
	}

	return installation, nil
}
