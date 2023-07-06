package models

import (
	"time"

	"github.com/google/uuid"
)

type (
	Account struct {
		ID uuid.UUID `db:"id" json:"id" validate:"required,uuid"`

		UserID             string    `db:"user_id" json:"user_id" validate:"required"`
		Provider           string    `db:"type" json:"type" validate:"required"`
		ProviderAccountID  string    `db:"account_id" json:"account_id" validate:"required"`
		RefreshToken       string    `db:"refresh_token" json:"refresh_token"`
		Type               string    `db:"type" json:"type" validate:"required"`
		AccessToken        string    `db:"access_token" json:"access_token"`
		AccessTokenExpires time.Time `db:"access_token_expires" json:"access_token_expires"`
		Scope              string    `db:"scope" json:"scope"`
		IDToken            string    `db:"id_token" json:"id_token"`
		SessionState       string    `db:"session_state" json:"session_state"`
	}

	Session struct {
		ID           uuid.UUID `db:"id" json:"id" validate:"required,uuid"`
		SessionToken string    `db:"session_token" json:"session_token" validate:"required"`
		UserID       string    `db:"user_id" json:"user_id" validate:"required"`
		Expires      time.Time `db:"expires" json:"expires" validate:"required"`
	}

	User struct {
		ID     uuid.UUID `db:"id" json:"id" validate:"required,uuid"`
		Name   string    `db:"name" json:"name" validate:"required"`
		Email  string    `db:"email" json:"email" validate:"required"`
		Avatar string    `db:"avatar" json:"avatar" validate:"required"`
	}
)
