package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

// status enum
const (
	BUILD_STATUS_UPLOADING  = "uploading"
	BUILD_STATUS_PROCESSING = "processing"
	BUILD_STATUS_FAILED     = "failed"
	BUILD_STATUS_ABORTED    = "aborted"
	BUILD_STATUS_APPROVED   = "approved"
	BUILD_STATUS_REJECTED   = "rejected"
	BUILD_STATUS_UNREVIEWED = "unreviewed"
	BUILD_STATUS_UNCHANGED  = "unchanged"
	BUILD_STATUS_ORPHANED   = "orphaned"
)

// Build struct for build model.
type Build struct {
	ID        uuid.UUID `db:"id" json:"id" validate:"required,uuid"`
	CreatedAt time.Time `db:"created_at" json:"createAt"`
	UpdatedAt time.Time `db:"updated_at" json:"updatedAt"`

	ProjectID uuid.UUID `db:"project_id" json:"projectID" validate:"required,uuid"`

	BuildNumber int `db:"build_number" json:"buildNumber"`

	ParentBuildID uuid.UUID `db:"parent_build_id" json:"parentBuildID" validate:"uuid"`

	Sha     string `db:"sha" json:"sha" validate:"required"`
	Branch  string `db:"branch" json:"branch" validate:"required"`
	Author  string `db:"author" json:"author"`
	Title   string `db:"title" json:"title"`
	Message string `db:"message" json:"message"`
	Status  string `db:"status" json:"status"`

	Errors pq.StringArray `db:"errors" json:"errors"`
}
