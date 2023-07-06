package queries

import (
	"context"

	"github.com/jmoiron/sqlx"
	"github.com/pixeleye-io/pixeleye/app/models"
	"golang.org/x/oauth2"
)

type AuthQueries struct {
	*sqlx.DB
}

func (q *AuthQueries) UpsertAccount(token oauth2.TokenSource, user models.User) error {
	getUserQuery := "SELECT * FROM account WHERE id = $1 FOR UPDATE"
	getAccountQuery := "SELECT * FROM account WHERE user_id = $1 AND provider = $2"
	insertUserQuery := "INSERT INTO account (id, user_id, provider, provider_account_id, refresh_token, type, access_token, access_token_expires, scope, id_token, session_state) VALUES (:id, :user_id, :provider, :provider_account_id, :refresh_token, :type, :access_token, :access_token_expires, :scope, :id_token, :session_state)"

	ctx := context.Background()

	tx, err := q.BeginTxx(ctx, nil)

	if err != nil {
		return err
	}

	defer tx.Rollback()

	_, err := q.NamedExecContext(ctx, query, account)
	if err != nil {
		return err
	}

	return nil
}
