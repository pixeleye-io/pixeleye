package models

import (
	"time"

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
	ID        string    `db:"id" json:"id" validate:"required,nanoid"`
	CreatedAt time.Time `db:"created_at" json:"createdAt"`
	UpdatedAt time.Time `db:"updated_at" json:"updatedAt"`

	ProjectID string `db:"project_id" json:"projectID" validate:"required,nanoid"`

	BuildNumber int `db:"build_number" json:"buildNumber"`

	ParentBuildID string `db:"parent_build_id" json:"parentBuildID" validate:"omitempty,nanoid"`

	Sha                string         `db:"sha" json:"sha" validate:"required"`
	Branch             string         `db:"branch" json:"branch" validate:"required"`
	Title              string         `db:"title" json:"title,omitempty"`
	Message            string         `db:"message" json:"message,omitempty"`
	Status             string         `db:"status" json:"status" validate:"required,oneof=uploading processing failed aborted approved rejected unreviewed unchanged orphaned"`
	Errors             pq.StringArray `db:"errors" json:"errors,omitempty"`
	Warnings           pq.StringArray `db:"warnings" json:"warnings,omitempty"`
	DeletedSnapshotIDs pq.StringArray `db:"deleted_snapshot_ids" json:"deletedSnapshotIDs,omitempty"`
	ApprovedBy         string         `db:"approved_by" json:"approvedBy,omitempty"`
}
