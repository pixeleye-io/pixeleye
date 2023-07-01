package models

import (
	"time"

	"github.com/google/uuid"
)

// Build struct for build model.
type Build struct {
	ID        uuid.UUID `db:"id" json:"id" validate:"required,uuid"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`

	Sha     string `db:"sha" json:"sha" validate:"required"`
	Branch  string `db:"branch" json:"branch" validate:"required"`
	Author  string `db:"author" json:"author"`
	Title   string `db:"title" json:"title"`
	Message string `db:"message" json:"message"`
}
