package queries

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
	nanoid "github.com/matoous/go-nanoid/v2"
	"github.com/pixeleye-io/pixeleye/app/models"
	team_queries "github.com/pixeleye-io/pixeleye/app/queries/team"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/pixeleye-io/pixeleye/platform/identity"
	"github.com/rs/zerolog/log"
)

type UserQueries struct {
	*sqlx.DB
}

func (q *UserQueries) GetUserByAuthID(authID string) (models.User, error) {
	query := `SELECT * FROM users WHERE auth_id = $1`

	user := models.User{}

	if err := q.Get(&user, query, authID); err != nil {
		return user, err
	}

	return user, nil
}

func (q *UserQueries) CreateUser(ctx context.Context, userID string, userTraits models.UserTraits) (models.User, error) {

	query := `INSERT INTO users (id, name, email, avatar_url, auth_id, created_at, updated_at, github_id, gitlab_id, bitbucket_id) VALUES (:id, :name, :email, :avatar_url, :auth_id, :created_at, :updated_at, :github_id, :gitlab_id, :bitbucket_id)`

	time := utils.CurrentTime()

	user := models.User{
		AuthID:    userID,
		CreatedAt: time,
		UpdatedAt: time,
		Name:      userTraits.Name,
		Email:     userTraits.Email,
		Avatar:    userTraits.Avatar,
	}

	tokens, err := identity.GetTokens(ctx, userID)

	if err != nil {
		return user, err
	}

	log.Debug().Msgf("Tokens: %v", tokens)

	configsRaw, ok := tokens.GetConfig()["providers"]

	if !ok {
		return user, errors.New("failed to get providers from config")
	}

	configs, ok := configsRaw.([]interface{})

	if !ok {
		return user, errors.New("failed to cast providers to map")
	}

	for _, c := range configs {

		config, ok := c.(map[string]interface{})

		if !ok {
			continue
		}

		switch config["provider"] {
		case "github":
			user.GithubID = config["subject"].(string)
		}
	}

	id, err := nanoid.New()

	if err != nil {
		return user, err
	}

	user.ID = id

	validator := utils.NewValidator()

	if err := validator.Struct(user); err != nil {
		errMsg := utils.ValidatorErrors(err)
		log.Error().Err(err).Msgf("%v", errMsg)
		return user, fmt.Errorf("%v", errMsg)
	}

	if _, err := q.NamedQuery(query, user); err != nil {
		return user, err
	}

	return user, nil
}

func (q *UserQueries) GetUsersTeams(ctx context.Context, id string) ([]models.Team, error) {
	query := `SELECT team.*, team_users.role FROM team JOIN team_users ON team.id = team_users.team_id WHERE team_users.user_id = $1`

	teams := []models.Team{}

	if err := q.Select(&teams, query, id); err != nil && err != sql.ErrNoRows {
		return teams, err
	}

	personalTeamExists := false

	for _, team := range teams {
		if team.Type == "user" && utils.SafeDeref(team.OwnerID) == id {
			personalTeamExists = true
		}
	}

	if !personalTeamExists {

		tx, err := q.BeginTxx(ctx, nil)

		if err != nil {
			return teams, err
		}

		qt := team_queries.TeamQueriesTx{Tx: tx}

		team := models.Team{
			Type:      models.TEAM_TYPE_USER,
			Name:      "Personal",
			AvatarURL: "",
		}

		// This is a new user, so we need to create a new team for them.

		if err := qt.CreateTeam(ctx, &team, id); err != nil {
			return teams, err
		}

		err = qt.Commit()

		if driverErr, ok := err.(*pq.Error); ok {
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

func (q *UserQueries) GetUsersPersonalTeam(ctx context.Context, id string) (models.Team, error) {
	teams, err := q.GetUsersTeams(ctx, id)

	if err != nil {
		return models.Team{}, err
	}

	for _, team := range teams {
		if team.Type == models.TEAM_TYPE_USER && utils.SafeDeref(team.OwnerID) == id {
			return team, nil
		}
	}

	return models.Team{}, errors.New("user does not have a personal team")
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

	// nolint:errcheck
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

	return tx.Commit()
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
