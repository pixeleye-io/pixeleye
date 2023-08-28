package Github_queries

import "github.com/pixeleye-io/pixeleye/app/models"

func (q *GithubQueries) GetGithubAppInstallation(installationID string) (models.GitInstallation, error) {
	query := `SELECT * FROM git_installation WHERE installation_id = $1`

	installation := models.GitInstallation{}

	err := q.Get(&installation, query, installationID)

	if err != nil {
		return models.GitInstallation{}, err
	}

	return installation, nil
}
