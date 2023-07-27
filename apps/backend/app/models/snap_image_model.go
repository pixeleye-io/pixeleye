package models

import "time"

type SnapImage struct {
	ID        string    `db:"id" json:"id" validate:"required,nanoid"`
	CreatedAt time.Time `db:"created_at" json:"createdAt"`

	Hash      string `db:"hash" json:"hash" validate:"required"`
	ProjectID string `db:"project_id" json:"projectID" validate:"required,nanoid"`
}
