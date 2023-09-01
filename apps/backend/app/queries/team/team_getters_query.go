package Team_queries

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/pixeleye-io/pixeleye/app/models"
)

// isAdmin bool is for check user is admin. If user is admin, user can see all projects in team.
// If user is not admin, user can see only projects that user is member of.
func (q *TeamQueries) GetTeamsProjects(teamID string, userID string, isAdmin bool) ([]models.Project, error) {
	query := `SELECT * FROM project JOIN project_users ON project.id = project_users.project_id WHERE project.team_id = $1 project_users.user_id = $2`
	queryAdmin := `SELECT * FROM project WHERE team_id = $1`

	projects := []models.Project{}

	var err error
	if isAdmin {
		err = q.Select(&projects, queryAdmin, teamID, userID)
	} else {
		err = q.Select(&projects, query, teamID, userID)
	}

	if err != nil && err != sql.ErrNoRows {
		return projects, err
	}

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
	Type *string `db:"type"`
	Role string  `db:"role"`
}

func (q *TeamQueries) GetTeamUsers(ctx context.Context, teamID string) ([]UserOnTeam, error) {
	query := `SELECT users.*, team_users.type, team_users.role FROM team_users JOIN users ON team_users.user_id = users.id WHERE team_id = $1`

	users := []UserOnTeam{}

	err := q.SelectContext(ctx, &users, query, teamID)

	return users, err
}
