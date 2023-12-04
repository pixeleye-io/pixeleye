package models

import "time"

const (
	ACCOUNT_PROVIDER_GITHUB    = "github"
	ACCOUNT_PROVIDER_GITLAB    = "gitlab"
	ACCOUNT_PROVIDER_BITBUCKET = "bitbucket"
)

type Account struct {
	ID                    string    `db:"id" json:"id" validate:"required"`
	CreatedAt             time.Time `db:"created_at" json:"createdAt"`
	UpdatedAt             time.Time `db:"updated_at" json:"updatedAt"`
	UserID                string    `db:"user_id" json:"userID" validate:"required"`
	Provider              string    `db:"provider" json:"provider" validate:"required,oneof=github gitlab bitbucket"`
	ProviderAccountID     string    `db:"provider_account_id" json:"providerAccountID" validate:"required"`
	RefreshToken          string    `db:"refresh_token" json:"refreshToken" validate:"required"`
	AccessToken           string    `db:"access_token" json:"accessToken" validate:"required"`
	AccessTokenExpiresAt  time.Time `db:"access_token_expires_at" json:"accessTokenExpiresAt" validate:"required"`
	RefreshTokenExpiresAt time.Time `db:"refresh_token_expires_at" json:"refreshTokenExpiresAt" validate:"required"`
	ProviderAccountLogin  string    `db:"provider_account_login" json:"providerAccountLogin"`
}

type OauthAccountRefresh struct {
	ID        string    `db:"id" json:"id" validate:"required"`
	CreatedAt time.Time `db:"created_at" json:"createdAt"`
	AccountID string    `db:"account_id" json:"accountID" validate:"required"`
}
