package models

import (
	"database/sql"
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
	CreatedAt time.Time `db:"created_at" json:"createdAt"`
	UpdatedAt time.Time `db:"updated_at" json:"updatedAt"`

	Name           string         `db:"name" json:"name" validate:"required"`
	URL            sql.NullString `db:"url" json:"url,omitempty" validate:"omitempty,url"`
	Source         GitSource      `json:"source" db:"source" validate:"required,oneof=github gitlab bitbucket custom"`
	SourceID       string         `json:"sourceID,omitempty" db:"source_id"`
	Token          string         `db:"token" json:"-"`
	RawToken       string         `json:"token,omitempty" db:"-"` // This is used for sending the token to the client. It should only be populated when a project is first created
	LatestActivity *time.Time     `db:"latest_activity" json:"lastActivity"`
}
