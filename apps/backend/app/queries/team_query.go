package queries

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
	nanoid "github.com/matoous/go-nanoid/v2"
	"github.com/pixeleye-io/pixeleye/app/models"
)

type TeamQueries struct {
	*sqlx.DB
}

func (q *TeamQueries) CreateTeam(ownerId string, teamType string, teamName string) (models.Team, error) {
	createUserTeamQuery := `INSERT INTO team (id, name, type, avatar_url, url, created_at, updated_at, owner_id) VALUES (:id, :name, :type, :avatar_url, :url, :created_at, :updated_at, :owner_id)`
	createUserOnTeamQuery := `INSERT INTO team_users (team_id, user_id, role) VALUES (:team_id, :user_id, :role)`

	timeNow := time.Now()

	id, err := nanoid.New()

	if err != nil {
		return models.Team{}, err
	}

	team := models.Team{
		ID:        id,
		Type:      teamType,
		Name:      teamName,
		CreatedAt: timeNow,
		UpdatedAt: timeNow,
		Role:      models.TEAM_MEMBER_ROLE_OWNER,
	}

	if teamType == models.TEAM_TYPE_USER {
		// This ensures that the a user can only ever have one personal team.
		// They can own as many other teams as they want.
		team.OwnerID = ownerId
	}

	ctx := context.Background()

	tx, err := q.BeginTxx(ctx, nil)

	if err != nil {
		return team, err
	}

	defer tx.Rollback()

	if _, err = tx.NamedExecContext(ctx, createUserTeamQuery, team); err != nil {
		return team, err
	}

	userOnTeam := models.TeamMember{
		TeamID: team.ID,
		UserID: ownerId,
		Role:   models.TEAM_MEMBER_ROLE_OWNER,
	}

	if _, err = tx.NamedExecContext(ctx, createUserOnTeamQuery, userOnTeam); err != nil {
		return team, err
	}

	tx.Commit()

	return team, err
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
	query := `SELECT team.* FROM team JOIN team_users ON team.id = team_users.team_id WHERE team.id = $1 AND team_users.user_id = $2`

	team := models.Team{}

	if err := q.Get(&team, query, teamID, userID); err != nil {
		if err == sql.ErrNoRows {
			return team, fmt.Errorf("team not found")
		}
		return team, err
	}

	return team, nil
}
