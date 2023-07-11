package queries

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/pixeleye-io/pixeleye/app/models"
	"golang.org/x/oauth2"
)

type AuthQueries struct {
	*sqlx.DB
}

type AccountInfo struct {
	ID     string
	Name   string
	Email  string
	Avatar string
}

func (q *AuthQueries) UpsertAccount(token oauth2.Token, userInfo AccountInfo, provider string) (models.User, error) {
	getUserQuery := "SELECT * FROM user WHERE email = $1 FOR UPDATE"
	insertUserQuery := "INSERT INTO user (id, name, email, avatar) VALUES (:id, :name, :email, :avatar)"
	insertAccountQuery := "INSERT INTO account (user_id, provider, provider_account_id, refresh_token, type, access_token, access_token_expires) VALUES (:user_id, :provider, :provider_account_id, :refresh_token, :type, :access_token, :access_token_expires) ON CONFLICT (user_id, provider, provider_account_id) DO UPDATE SET refresh_token = :refresh_token, access_token = :access_token, access_token_expires = :access_token_expires"
	updateUser := "UPDATE user SET name = :name, email = :email, avatar = :avatar WHERE id = :id"

	ctx := context.Background()

	tx, err := q.BeginTxx(ctx, nil)

	if err != nil {
		return models.User{}, err
	}

	defer tx.Rollback()

	user := models.User{}
	err = tx.GetContext(ctx, &user, getUserQuery, userInfo.Email)

	if err == sql.ErrNoRows {
		user = models.User{
			ID:     uuid.New(),
			Name:   userInfo.Name,
			Email:  userInfo.Email,
			Avatar: userInfo.Avatar,
		}

		err = tx.GetContext(ctx, &user, insertUserQuery, user)

		if err != nil {
			return models.User{}, err
		}
	} else if err != nil {
		return models.User{}, err
	}

	account := models.Account{
		UserID:             user.ID,
		Provider:           provider,
		ProviderAccountID:  userInfo.ID,
		RefreshToken:       token.RefreshToken,
		Type:               token.TokenType,
		AccessToken:        token.AccessToken,
		AccessTokenExpires: token.Expiry,
	}

	_, err = tx.NamedExecContext(ctx, insertAccountQuery, account)

	if err != nil {
		return models.User{}, err
	}

	shouldUpdateUser := false

	if user.Name == "" {
		user.Name = userInfo.Name
		shouldUpdateUser = true
	}

	if user.Avatar == "" {
		user.Avatar = userInfo.Avatar
		shouldUpdateUser = true
	}

	if shouldUpdateUser {
		_, err = tx.NamedExecContext(ctx, updateUser, user)

		if err != nil {
			return models.User{}, err
		}
	}

	err = tx.Commit()

	if err != nil {
		return models.User{}, err
	}

	return user, nil
}