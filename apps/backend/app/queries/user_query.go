package queries

import (
	"context"
	"database/sql"
	"time"

	"github.com/jmoiron/sqlx"
	nanoid "github.com/matoous/go-nanoid/v2"
	"github.com/pixeleye-io/pixeleye/app/models"
)

type UserQueries struct {
	*sqlx.DB
}

func (q *UserQueries) createUserPersonalTeam() (models.Team, error) {
	createUserTeamQuery := `INSERT INTO team (id, type, created_at, updated_at) VALUES (:id, :type, :created_at, :updated_at)`
	createUserOnTeamQuery := `INSERT INTO team_users (team_id, user_id, role) VALUES (:team_id, :user_id, :role)`

	team := models.Team{
		Type: "user",
	}

	ctx := context.Background()

	tx, err := q.BeginTxx(ctx, nil)

	if err != nil {
		return team, err
	}

	defer tx.Rollback()

	id, err := nanoid.New()

	if err != nil {
		return team, err
	}

	team.ID = id

	timeNow := time.Now()
	team.CreatedAt = timeNow
	team.UpdatedAt = timeNow

	_, err = tx.NamedExecContext(ctx, createUserTeamQuery, team)

	if err != nil {
		return team, err
	}

	userOnTeam := models.TeamMember{
		TeamID: team.ID,
		UserID: team.ID,
		Role:   models.TEAM_MEMBER_ROLE_OWNER,
	}

	_, err = tx.NamedExecContext(ctx, createUserOnTeamQuery, userOnTeam)

	if err != nil {
		return team, err
	}

	tx.Commit()

	return team, err
}

func (q *UserQueries) GetUsersPersonalTeam(id string) (models.Team, error) {
	team := models.Team{}

	query := `SELECT team.* FROM team JOIN team_users ON team.id = team_users.team_id AND team_users.user_id = $1 AND team.type = 'user'`

	err := q.Get(&team, query, id)

	if err == sql.ErrNoRows {
		// This is a new user, so we need to create a new team for them.
		team, err = q.createUserPersonalTeam()

		if err != nil {
			return team, err
		}
	}

	return team, err
}

func (q *UserQueries) GetUsersTeams(id string) ([]models.Team, error) {
	query := `SELECT team.* FROM team JOIN team_users ON team.id = team_users.team_id AND team_users.user_id = $1`

	teams := []models.Team{}

	err := q.Select(&teams, query, id)

	if err != nil && err != sql.ErrNoRows {
		return teams, err
	}

	personalTeamExists := false

	for _, team := range teams {
		if team.Type == "user" {
			personalTeamExists = true
		}
	}

	if !personalTeamExists {
		// This is a new user, so we need to create a new team for them.
		team, err := q.createUserPersonalTeam()

		if err != nil {
			return teams, err
		}

		teams = append(teams, team)
	}

	return teams, err
}
