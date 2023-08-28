package models

import "time"

type GitInstallation struct {
	ID        string    `db:"id" validate:"required,nanoid"`
	CreatedAt time.Time `db:"created_at"`
	UpdatedAt time.Time `db:"updated_at"`

	TeamID string `db:"team_id" validate:"required,nanoid"`

	Type string `db:"type" validate:"required,oneof=github gitlab bitbucket"`

	InstallationID string `db:"installation_id" validate:"required"`

	AccessToken string `db:"access_token" validate:"required"`
	ExpiresAt   int64  `db:"expires_at" validate:"required"`
}

const (
	GIT_TYPE_GITHUB    = "github"
	GIT_TYPE_GITLAB    = "gitlab"
	GIT_TYPE_BITBUCKET = "bitbucket"
)
