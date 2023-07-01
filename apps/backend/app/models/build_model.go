package models

import (
	"gorm.io/gorm"
)

// Build struct for build model.
type Build struct {
	gorm.Model
	Sha       string     `json:"sha"`
	Targets   []Build    ``
	Sources   []Build    ``
	Branch    string     `json:"branch"`
	Title     string     `json:"title"`
	Message   string     `json:"message"`
	Author    string     `json:"author"`
	Snapshots []Snapshot ``
}
