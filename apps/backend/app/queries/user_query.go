package queries

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/rs/zerolog/log"
)

type UserQueries struct {
	*sqlx.DB
}

func (q *UserQueries) GetUsersTeams(id string) ([]models.Team, error) {
	query := `SELECT team.*, team_users.role FROM team JOIN team_users ON team.id = team_users.team_id WHERE team_users.user_id = $1`

	teams := []models.Team{}

	if err := q.Select(&teams, query, id); err != nil && err != sql.ErrNoRows {
		return teams, err
	}

	personalTeamExists := false

	for _, team := range teams {
		if team.Type == "user" {
			personalTeamExists = true
		}
	}

	qt := TeamQueries{q.DB}

	if !personalTeamExists {
		// This is a new user, so we need to create a new team for them.
		team, err := qt.CreateTeam(id, models.TEAM_TYPE_USER, "Personal")

		if driverErr, ok := err.(*pq.Error); ok { // Now the error number is accessible directly
			if driverErr.Code == pq.ErrorCode("23505") {
				log.Error().Err(err).Msg("Duplicate key error, user already has a personal team.")
				// We have a duplicate key error, so have hit a race condition where another request has created the team for us.
				if err := q.Select(&teams, query, id); err != nil {
					return teams, err
				}
				return teams, nil
			}
		} else if err != nil {
			return teams, err
		}

		teams = append(teams, team)
	}

	return teams, nil
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
