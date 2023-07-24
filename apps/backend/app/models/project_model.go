package models

import (
	"time"
)

type GitSource string

const (
	SOURCE_GITHUB    GitSource = "github"
	SOURCE_GITLAB    GitSource = "gitlab"
	SOURCE_BITBUCKET GitSource = "bitbucket"
	SOURCE_CUSTOM    GitSource = "custom"
)

type Project struct {
	ID        string    `db:"id" json:"id" validate:"required"`
	CreatedAt time.Time `db:"created_at" json:"createAt"`
	UpdatedAt time.Time `db:"updated_at" json:"updatedAt"`

	Name string `db:"name" json:"name" validate:"required"`
	// Source   string    `json:"source" db:"source" validate:"required"`
	Source         GitSource  `json:"source" db:"source" validate:"required,git_source"`
	SourceID       string     `json:"sourceID" db:"source_id"`
	Token          string     `db:"token" json:"-"`
	RawToken       string     `json:"token" db:"-"` // This is used for sending the token to the client. It should only be populated when a project is first created
	LatestActivity *time.Time `db:"latest_activity" json:"lastActivity"`
}
