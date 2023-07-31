package queries

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/jmoiron/sqlx"
	nanoid "github.com/matoous/go-nanoid/v2"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/rs/zerolog/log"
)

type UserQueries struct {
	*sqlx.DB
}

func (q *UserQueries) createTeam(ownerId string, teamType string, teamName string) (models.Team, error) {
	createUserTeamQuery := `INSERT INTO team (id, name, type, avatar_url, url, created_at, updated_at) VALUES (:id, :name, :type, :avatar_url, :url, :created_at, :updated_at)`
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

func (q *UserQueries) GetUsersPersonalTeam(id string) (models.Team, error) {
	team := models.Team{}

	query := `SELECT team.* FROM team JOIN team_users ON team.id = team_users.team_id AND team_users.user_id = $1 AND team.type = 'user'`

	err := q.Get(&team, query, id)

	if err == sql.ErrNoRows {
		// This is a new user, so we need to create a new team for them.
		team, err = q.createTeam(id, models.TEAM_TYPE_USER, "Personal")

		if err != nil {
			return team, err
		}
	}

	return team, err
}

func (q *UserQueries) GetUsersTeams(id string) ([]models.Team, error) {
	query := `SELECT team.*, team_users.role FROM team JOIN team_users ON team.id = team_users.team_id AND team_users.user_id = $1`

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
		team, err := q.createTeam(id, models.TEAM_TYPE_USER, "Personal")

		if err != nil {
			return teams, err
		}

		teams = append(teams, team)
	}

	return teams, err
}

func (q *UserQueries) CreateUserDeleteRequest(id string, expiriesAt time.Time) error {
	query := `INSERT INTO user_delete_request (user_id, created_at, expiries_at) VALUES ($1, $2, $3)`

	_, err := q.Exec(query, id, time.Now(), expiriesAt)

	return err
}

func (q *UserQueries) deleteUser(id string) error {
	deleteUsersTeamQuery := `DELETE FROM team JOIN team_users ON team.id = team_users.team_id AND team_users.user_id = $1 WHERE team.type = 'user'`
	deleteUserOnTeamQuery := `DELETE FROM team_users WHERE user_id = $1`
	deleteUserOnProjectQuery := `DELETE FROM project_users WHERE user_id = $1`
	deleteUserRequestQuery := `DELETE FROM user_delete_request WHERE user_id = $1`

	ctx := context.Background()

	tx, err := q.BeginTxx(ctx, nil)

	if err != nil {
		return err
	}

	defer tx.Rollback()

	if _, err = tx.ExecContext(ctx, deleteUsersTeamQuery, id); err != nil {
		return err
	}

	if _, err = tx.ExecContext(ctx, deleteUserOnTeamQuery, id); err != nil {
		return err
	}

	if _, err = tx.ExecContext(ctx, deleteUserOnProjectQuery, id); err != nil {
		return err
	}

	if _, err = tx.ExecContext(ctx, deleteUserRequestQuery, id); err != nil {
		return err
	}

	tx.Commit()

	return nil
}

func (q *UserQueries) DeleteUsers() error {
	getUsersQuery := `SELECT * FROM user_deletion_request WHERE expiries_at < $1`

	users := []models.UserDeleteRequest{}

	err := q.Select(&users, getUsersQuery, time.Now())

	if err != nil {
		return err
	}

	log.Info().Msgf("Found %d users to delete, %v", len(users), users)

	didError := false

	for _, user := range users {
		err := q.deleteUser(user.UserID)

		if err != nil {
			didError = true
			log.Error().Err(err).Msgf("Failed to delete user %s", user.UserID)
		}

	}

	if didError {
		return errors.New("failed to delete all users")
	}

	return nil
}
