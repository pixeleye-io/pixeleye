package models

import "github.com/google/uuid"

type Project struct {
	ID       uuid.UUID `json:"id" validate:"required,uuid"`
	Name     string    `json:"name"`
	Source   string    `json:"source"`
	SourceID string    `json:"source_id" db:"source_id"`
}
