package models

import (
	"time"

	"github.com/google/uuid"
)

type GitSource string

const (
	SOURCE_GITHUB    GitSource = "github"
	SOURCE_GITLAB    GitSource = "gitlab"
	SOURCE_BITBUCKET GitSource = "bitbucket"
	SOURCE_CUSTOM    GitSource = "custom"
)

type Project struct {
	ID        uuid.UUID `db:"id" json:"id" validate:"required,uuid"`
	CreatedAt time.Time `db:"created_at" json:"createAt"`
	UpdatedAt time.Time `db:"updated_at" json:"updatedAt"`

	Name string `db:"name" json:"name" validate:"required"`
	// Source   string    `json:"source" db:"source" validate:"required"`
	Source   GitSource `json:"source" db:"source" validate:"required,git_source"`
	SourceID string    `json:"sourceID" db:"source_id"`
	Token    string    `db:"token" json:"-"` // TODO - only send this to the client once
}
