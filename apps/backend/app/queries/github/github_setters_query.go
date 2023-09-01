package Github_queries

import (
	"context"

	nanoid "github.com/matoous/go-nanoid/v2"

	git_github "github.com/pixeleye-io/pixeleye/app/git/github"
	"github.com/pixeleye-io/pixeleye/app/models"
	team_queries "github.com/pixeleye-io/pixeleye/app/queries/team"
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

func (q *GithubQueriesTx) UpdateGithubAppInstallation(context context.Context, installation *models.GitInstallation) error {
	query := `UPDATE git_installation SET installation_id = :installation_id, updated_at = :updated_at, team_id = :team_id WHERE id = :id`

	time := utils.CurrentTime()

	installation.UpdatedAt = time

	validate := utils.NewValidator()

	if err := validate.Struct(installation); err != nil {
		return err
	}

	if _, err := q.NamedExecContext(context, query, installation); err != nil {
		return err
	}

	return nil
}

func (q *GithubQueries) SyncTeamMembers(context context.Context, team models.Team) error {

	tq := team_queries.TeamQueries{
		DB: q.DB,
	}

	installation, err := tq.GetTeamInstallation(context, team.ID)

	if err != nil {
		return err
	}

	ghClient, err := git_github.NewGithubInstallClient(installation.InstallationID)

	if err != nil {
		return err
	}

	org, err := ghClient.GetInstallationInfo(context, installation.InstallationID)

	if err != nil {
		return err
	}

	gitMembers, err := ghClient.GetMembers(context, org.GetAccount().GetLogin())

	if err != nil {
		return err
	}

	currentMembers, err := tq.GetTeamUsers(context, team.ID)

	if err != nil {
		return err
	}

	newMembers := []models.TeamMember{}
	prevInvitedMembers := []models.TeamMember{}

	for _, gitMember := range gitMembers {
		found := false
		wasInvited := false
		for _, currentMember := range currentMembers {
			if gitMember.GetEmail() == currentMember.Email && currentMember.Type == nil {
				found = true
				break
			} else if currentMember.ID == gitMember.GetLogin() && utils.SafeDeref(currentMember.Type) == models.TEAM_MEMBER_TYPE_INVITED {
				wasInvited = true
				break
			}
		}

		memberType := models.TEAM_MEMBER_TYPE_GIT

		if !found {
			// TODO add user to team

		} else if wasInvited {
			// TODO update user type to git member
		}

	}

	return nil
}
