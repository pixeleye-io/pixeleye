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
	"github.com/rs/zerolog/log"
)

type UserQueries struct {
	*sqlx.DB
}

func (q *UserQueries) GetUserByAuthID(ctx context.Context, authID string) (models.User, error) {
	query := `SELECT * FROM users WHERE auth_id = $1`

	user := models.User{}

	if err := q.GetContext(ctx, &user, query, authID); err != nil {
		return user, err
	}

	return user, nil
}

func (q *UserQueries) CreateAccount(ctx context.Context, account *models.Account) error {
	query := `INSERT INTO account (id, user_id, provider, access_token, access_token_expires_at, refresh_token, refresh_token_expires_at, created_at, updated_at, provider_account_id, provider_account_login) VALUES (:id, :user_id, :provider, :access_token, :access_token_expires_at, :refresh_token, :refresh_token_expires_at, :created_at, :updated_at, :provider_account_id, :provider_account_login) ON CONFLICT (provider, provider_account_id) DO UPDATE SET access_token = :access_token, access_token_expires_at = :access_token_expires_at, refresh_token = :refresh_token, refresh_token_expires_at = :refresh_token_expires_at, updated_at = :updated_at RETURNING *`

	id, err := nanoid.New()
	if err != nil {
		return err
	}

	time := utils.CurrentTime()

	account.CreatedAt = time
	account.UpdatedAt = time
	account.ID = id

	validator := utils.NewValidator()
	if err := validator.Struct(account); err != nil {
		return fmt.Errorf("%v", utils.ValidatorErrors(err))
	}

	rows, err := q.NamedQueryContext(ctx, query, account)
	if err != nil {
		return err
	}

	if rows.Next() {
		if err := rows.StructScan(&account); err != nil {
			return err
		}
	}

	return nil
}

func (q *UserQueries) DeleteAccount(ctx context.Context, id string) error {
	query := `DELETE FROM account WHERE id = $1`

	_, err := q.ExecContext(ctx, query, id)

	return err
}

func (q *UserQueries) GetUserAccounts(ctx context.Context, userID string) ([]models.Account, error) {
	query := `SELECT * FROM account WHERE user_id = $1`

	accounts := []models.Account{}

	if err := q.SelectContext(ctx, &accounts, query, userID); err != nil {
		return accounts, err
	}

	return accounts, nil
}

func (q *UserQueries) CreateOauthState(ctx context.Context, account models.Account) (models.OauthAccountRefresh, error) {
	query := `INSERT INTO oauth_account_refresh (id, created_at, account_id) VALUES (:id, :created_at, :account_id)`

	id, err := nanoid.New()
	if err != nil {
		return models.OauthAccountRefresh{}, err
	}

	oauth := models.OauthAccountRefresh{
		ID:        id,
		CreatedAt: utils.CurrentTime(),
		AccountID: account.ID,
	}

	_, err = q.NamedExecContext(ctx, query, oauth)

	return oauth, err
}

func (q *UserQueries) GetOauthState(ctx context.Context, id string) (models.OauthAccountRefresh, error) {
	query := `SELECT * FROM oauth_account_refresh WHERE id = $1`

	oauth := models.OauthAccountRefresh{}

	if err := q.GetContext(ctx, &oauth, query, id); err != nil {
		return oauth, err
	}

	return oauth, nil
}

func (q *UserQueries) DeleteExpiredOauthStates(ctx context.Context) error {
	query := `DELETE FROM oauth_account_refresh WHERE created_at < $1`

	_, err := q.ExecContext(ctx, query, time.Now().Add(-time.Hour)) // Avoids deleting the state before the user has a chance to use it

	return err
}

func (q *UserQueries) CreateUser(ctx context.Context, userID string, userTraits models.UserTraits) (models.User, error) {
	query := `INSERT INTO users (id, name, email, avatar_url, auth_id, created_at, updated_at) VALUES (:id, :name, :email, :avatar_url, :auth_id, :created_at, :updated_at)`

	id, err := nanoid.New()
	if err != nil {
		return models.User{}, err
	}

	time := utils.CurrentTime()

	user := models.User{
		AuthID:    userID,
		CreatedAt: time,
		UpdatedAt: time,
		Name:      userTraits.Name,
		Email:     userTraits.Email,
		Avatar:    userTraits.Avatar,
		ID:        id,
	}

	validator := utils.NewValidator()

	if err := validator.Struct(user); err != nil {
		return user, fmt.Errorf("%v", utils.ValidatorErrors(err))
	}

	if _, err := q.NamedQueryContext(ctx, query, user); err != nil {
		return user, err
	}

	return user, nil
}

func (q *UserQueries) GetUsersTeams(ctx context.Context, id string) ([]models.Team, error) {
	query := `SELECT team.*, team_users.role, EXISTS(select * from git_installation where git_installation.team_id = team.id) as has_install FROM team JOIN team_users ON team.id = team_users.team_id WHERE team_users.user_id = $1`

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
			Type:    models.TEAM_TYPE_USER,
			Name:    "Personal",
			OwnerID: &id,
		}

		// This is a new user, so we need to create a new team for them.

		err = qt.CreateTeam(ctx, &team, id)

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

		if err := qt.Commit(); err != nil {
			return teams, err
		}

		teams = append(teams, team)
	}

	return teams, nil
}

func (q *UserQueries) GetUserByEmail(ctx context.Context, email string) (models.User, error) {
	query := `SELECT * FROM users WHERE email = $1`

	user := models.User{}

	if err := q.GetContext(ctx, &user, query, email); err != nil {
		return user, err
	}

	return user, nil
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

	defer func() {
		if err := tx.Rollback(); err != nil {
			log.Error().Err(err).Msg("Rollback failed")
		}
	}()

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

func (q *UserQueries) GetUserByProviderID(ctx context.Context, id string, provider string) (models.User, error) {
	query := `SELECT users.*, github_account.provider_account_id as github_id
	FROM users
	JOIN account github_account ON users.id = github_account.user_id
	WHERE github_account.provider_account_id = $1 AND provider = $2`

	user := models.User{}

	if err := q.GetContext(ctx, &user, query, id, provider); err != nil {
		return user, err
	}

	return user, nil
}

func (q *UserQueries) GetUserAccountByProvider(ctx context.Context, id string, provider string) (models.Account, error) {
	query := `SELECT * FROM account WHERE user_id = $1 AND provider = $2`

	accounts := models.Account{}

	if err := q.GetContext(ctx, &accounts, query, id, provider); err != nil {
		return accounts, err
	}

	return accounts, nil
}

func (q *UserQueries) GetAccount(ctx context.Context, id string) (models.Account, error) {
	query := `SELECT * FROM account WHERE id = $1`

	accounts := models.Account{}

	if err := q.GetContext(ctx, &accounts, query, id); err != nil {
		return accounts, err
	}

	return accounts, nil
}

func (q *UserQueries) UpdateAccount(ctx context.Context, account *models.Account) error {
	query := `UPDATE account SET access_token = :access_token, access_token_expires_at = :access_token_expires_at, refresh_token = :refresh_token, refresh_token_expires_at = :refresh_token_expires_at, updated_at = :updated_at WHERE id = :id`

	account.UpdatedAt = utils.CurrentTime()

	_, err := q.NamedExecContext(ctx, query, account)

	return err
}

func (q *UserQueries) UpdateUserProfile(ctx context.Context, user models.User) error {
	query := `UPDATE users SET name = :name, avatar_url = :avatar_url, updated_at = :updated_at WHERE id = :id`

	user.UpdatedAt = utils.CurrentTime()

	_, err := q.NamedExecContext(ctx, query, user)

	return err
}
