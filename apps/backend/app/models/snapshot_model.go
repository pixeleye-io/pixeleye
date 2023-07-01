package models

import (
	"gorm.io/gorm"
)

type Snapshot struct {
	gorm.Model
	BuildID uint   `json:"buildID"`
	URL     string `json:"url"`
	Name    string `json:"name"`
	Variant string `json:"variant"`
	Target  string `json:"target"`
}
