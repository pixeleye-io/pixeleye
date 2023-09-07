package Team_queries

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/pixeleye-io/pixeleye/app/models"
)

func (q *TeamQueries) GetTeamsProjects(ctx context.Context, teamID string) ([]models.Project, error) {
	query := `SELECT * FROM project WHERE team_id = $1`

	projects := []models.Project{}

	err := q.SelectContext(ctx, &projects, query, teamID)

	return projects, err
}

func (q *TeamQueries) GetTeam(ctx context.Context, teamID string, userID string) (models.Team, error) {
	query := `SELECT team.*, team_users.Role FROM team JOIN team_users ON team.id = team_users.team_id WHERE team.id = $1 AND team_users.user_id = $2`

	team := models.Team{}

	if err := q.GetContext(ctx, &team, query, teamID, userID); err != nil {
		if err == sql.ErrNoRows {
			return team, fmt.Errorf("team not found")
		}
		return team, err
	}

	return team, nil
}

func (q *TeamQueries) GetTeamFromExternalID(ctx context.Context, externalID string) (models.Team, error) {
	query := `SELECT * FROM team WHERE external_id = $1`

	team := models.Team{}

	err := q.GetContext(ctx, &team, query, externalID)

	return team, err
}

func (q *TeamQueries) GetTeamInstallation(ctx context.Context, teamID string) (models.GitInstallation, error) {
	query := `SELECT * FROM git_installation WHERE team_id = $1`

	installation := models.GitInstallation{}

	err := q.GetContext(ctx, &installation, query, teamID)

	return installation, err
}

func (q *TeamQueries) GetGitTeamUsers(ctx context.Context, teamID string) ([]models.TeamMember, error) {
	query := `SELECT * FROM team_users WHERE team_id = $1 AND type = $2`

	users := []models.TeamMember{}

	err := q.SelectContext(ctx, &users, query, teamID, models.TEAM_MEMBER_TYPE_GIT)

	return users, err
}

type UserOnTeam struct {
	*models.User
	Type     *string `db:"type"`
	Role     string  `db:"role"`
	RoleSync bool    `db:"role_sync"`
}

func (q *TeamQueries) GetTeamUsers(ctx context.Context, teamID string) ([]UserOnTeam, error) {
	query := `SELECT users.*, team_users.type, team_users.role, team_users.role_sync FROM team_users JOIN users ON team_users.user_id = users.id WHERE team_id = $1`

	users := []UserOnTeam{}

	err := q.SelectContext(ctx, &users, query, teamID)

	return users, err
}

func (q *TeamQueries) GetGitInstallations(ctx context.Context, teamID string) ([]models.GitInstallation, error) {
	query := `SELECT * FROM git_installation WHERE team_id = $1`

	installations := []models.GitInstallation{}

	err := q.SelectContext(ctx, &installations, query, teamID)

	return installations, err
}

func (q *TeamQueries) GetGitInstallation(ctx context.Context, teamID string, gitType string, isUserTeam bool) (models.GitInstallation, error) {
	installations, err := q.GetGitInstallations(ctx, teamID)

	if err != nil {
		return models.GitInstallation{}, err
	}

	if len(installations) == 0 {
		return models.GitInstallation{}, fmt.Errorf("no git installations found for team %s", teamID)
	} else if !isUserTeam && len(installations) > 1 {
		return models.GitInstallation{}, fmt.Errorf("multiple installations found for team %s. Only 1 per non user team allowed", teamID)
	}

	var installation models.GitInstallation
	for _, i := range installations {
		if i.Type == gitType {
			installation = i
			break
		}
	}

	if installation.ID == "" {
		return models.GitInstallation{}, fmt.Errorf("no git installation found for type %s", gitType)
	}

	return installation, nil
}
