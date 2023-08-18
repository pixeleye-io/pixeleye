package models

import "time"

type DiffImage struct {
	ID        string    `db:"id" json:"id" validate:"required,nanoid"`
	CreatedAt time.Time `db:"created_at" json:"createdAt"`

	Hash string `db:"hash" json:"hash" validate:"required"`

	Width  int    `db:"width" json:"width" validate:"required"`
	Height int    `db:"height" json:"height" validate:"required"`
	Format string `db:"format" json:"format" validate:"required"`

	ProjectID string `db:"project_id" json:"projectID" validate:"required,nanoid"`
}
