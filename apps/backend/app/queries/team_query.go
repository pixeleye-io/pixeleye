package queries

import (
	"database/sql"

	"github.com/jmoiron/sqlx"
	"github.com/pixeleye-io/pixeleye/app/models"
)

type TeamQueries struct {
	*sqlx.DB
}

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

func (q *TeamQueries) GetTeam(teamID string, userID string) (models.Team, error) {
	query := `SELECT * FROM team JOIN team_members ON team.id = team_members.team_id AND team_users.user_id = $1 WHERE team.id = $2`

	team := models.Team{}

	if err := q.Get(&team, query, userID, teamID); err != nil {
		return team, err
	}

	return team, nil
}
