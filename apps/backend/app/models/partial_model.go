package models

type Partial struct {
	Snapshots []Snapshot `json:"snapshots" validate:"required,dive,required"`
}
