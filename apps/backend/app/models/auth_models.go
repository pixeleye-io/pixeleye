package models

import (
	"time"

	"github.com/google/uuid"
)

type (
	Account struct {
		ID uuid.UUID `db:"id" json:"id" validate:"required,uuid"`

		UserID             uuid.UUID `db:"user_id"`
		Provider           string    `db:"provider"`
		ProviderAccountID  string    `db:"provider_account_id"`
		RefreshToken       string    `db:"refresh_token"`
		Type               string    `db:"type"`
		AccessToken        string    `db:"access_token"`
		AccessTokenExpires time.Time `db:"access_token_expires"`
	}

	Session struct {
		ID           uuid.UUID `db:"id" json:"id" validate:"required,uuid"`
		SessionToken string    `db:"session_token" json:"session_token" validate:"required"`
		UserID       uuid.UUID `db:"user_id" json:"user_id" validate:"required"`
		Expires      time.Time `db:"expires" json:"expires" validate:"required"`
	}

	User struct {
		ID        uuid.UUID `db:"id" json:"id" validate:"required,uuid"`
		Name      string    `db:"name" json:"name" validate:"required"`
		Email     string    `db:"email" json:"email" validate:"required"`
		AvatarURL string    `db:"avatar_url" json:"avatar_url" validate:"required"`
		CreatedAt time.Time `db:"created_at"`
		UpdatedAt time.Time `db:"updated_at"`
	}

	Renew struct {
		RefreshToken string `json:"refresh_token" validate:"required"`
	}
)
