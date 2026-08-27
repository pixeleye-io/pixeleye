package models

import "time"

type GitInstallation struct {
	ID        string    `db:"id" validate:"required,nanoid" json:"id"`
	CreatedAt time.Time `db:"created_at" json:"createdAt"`
	UpdatedAt time.Time `db:"updated_at" json:"updatedAt"`

	TeamID string `db:"team_id" validate:"required,nanoid" json:"teamID"`

	Type string `db:"type" validate:"required,oneof=github gitlab bitbucket bitbucket_server" json:"type"`

	InstallationID string `db:"installation_id" validate:"required" json:"installationID"`

	// AccessToken/RefreshToken/TokenExpiresAt are used by Bitbucket Cloud (OAuth) and
	// Bitbucket Server (access token). Unused by GitHub, which mints short-lived App
	// installation tokens on demand instead of storing one.
	AccessToken    *string    `db:"access_token" json:"-"`
	RefreshToken   *string    `db:"refresh_token" json:"-"`
	TokenExpiresAt *time.Time `db:"token_expires_at" json:"-"`

	// BaseURL is the self-hosted server URL for Bitbucket Server installations.
	BaseURL *string `db:"base_url" json:"baseURL,omitempty"`
}

// GitRepoPage is a single page of a team's repos. Next is an opaque cursor to pass back as
// the "next" query param to fetch the following page, empty when there isn't one.
type GitRepoPage struct {
	Repos []GitRepo `json:"repos"`
	Next  string    `json:"next"`
}

type GitRepo struct {
	ID            string     `json:"id"`
	Name          *string    `json:"name"`
	Private       *bool      `json:"private"`
	URL           *string    `json:"url"`
	LastUpdated   *time.Time `json:"lastUpdated,omitempty"`
	Description   *string    `json:"description"`
	DefaultBranch *string    `json:"defaultBranch"`
}

const (
	GIT_TYPE_GITHUB           = "github"
	GIT_TYPE_GITLAB           = "gitlab"
	GIT_TYPE_BITBUCKET        = "bitbucket"
	GIT_TYPE_BITBUCKET_SERVER = "bitbucket_server"
)
