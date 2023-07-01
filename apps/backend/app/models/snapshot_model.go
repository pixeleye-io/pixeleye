package models

import (
	"time"

	"github.com/google/uuid"
)

type Snapshot struct {
	ID        uuid.UUID `db:"id" json:"id" validate:"required,uuid"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`

	BuildID uuid.UUID `db:"build_id" json:"build_id" validate:"required"`
	Name    string    `db:"name" json:"name" validate:"required"`
	Variant string    `db:"variant" json:"variant"`
	Target  string    `db:"target" json:"target"`
	URL     string    `db:"url" json:"url" validate:"required"`
}
