package models

import "time"

type GitInstallation struct {
	ID        string    `db:"id" validate:"required,nanoid" json:"id"`
	CreatedAt time.Time `db:"created_at" json:"createdAt"`
	UpdatedAt time.Time `db:"updated_at" json:"updatedAt"`

	TeamID string `db:"team_id" validate:"required,nanoid" json:"teamID"`

	Type string `db:"type" validate:"required,oneof=github gitlab bitbucket" json:"type"`

	InstallationID string `db:"installation_id" validate:"required" json:"installationID"`
}

type GitRepo struct {
	ID          string    `json:"id"`
	Name        *string   `json:"name"`
	Private     *bool     `json:"private"`
	URL         *string   `json:"url"`
	LastUpdated time.Time `json:"lastUpdated"`
	Description *string   `json:"description"`
}

const (
	GIT_TYPE_GITHUB    = "github"
	GIT_TYPE_GITLAB    = "gitlab"
	GIT_TYPE_BITBUCKET = "bitbucket"
)
