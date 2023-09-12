package models

import (
	"time"

	"github.com/lib/pq"
)

const (
	BUILD_STATUS_UPLOADING         = "uploading"
	BUILD_STATUS_ABORTED_UPLOADING = "aborted-uploading"
	BUILD_STATUS_QUEUED_UPLOADING  = "queued-uploading" // We are still uploading snapshots to this build but we aren't asynchronously processing them yet.

	BUILD_STATUS_QUEUED_PROCESSING  = "queued-processing" // We are have finished uploading snapshots to this build but we are still waiting for the previous build to finish processing.
	BUILD_STATUS_PROCESSING         = "processing"
	BUILD_STATUS_ABORTED_PROCESSING = "aborted-processing"

	BUILD_STATUS_FAILED     = "failed"
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

	ParentBuildIDs []string `db:"-" json:"parentBuildIDs,omitempty" validate:"omitempty"` // TODO build nanoid array validator
	TargetParentID string   `db:"target_parent_id" json:"targetParentID,omitempty" validate:"omitempty,nanoid"`
	TargetBuildID  string   `db:"target_build_id" json:"targetBuildID,omitempty" validate:"omitempty,nanoid"`

	IsLatest bool `db:"is_latest" json:"isLatest"`

	Sha                string         `db:"sha" json:"sha" validate:"required"`
	Branch             string         `db:"branch" json:"branch" validate:"required"`
	Title              string         `db:"title" json:"title,omitempty"`
	Message            string         `db:"message" json:"message,omitempty"`
	Status             string         `db:"status" json:"status" validate:"required,oneof=uploading processing failed aborted approved rejected unreviewed unchanged orphaned queued-uploading queued-processing"`
	Errors             pq.StringArray `db:"errors" json:"errors,omitempty"`
	Warnings           pq.StringArray `db:"warnings" json:"warnings,omitempty"`
	DeletedSnapshotIDs pq.StringArray `db:"deleted_snapshot_ids" json:"deletedSnapshotIDs,omitempty"`
}

type BuildHistory struct {
	ParentID string `db:"parent_id" json:"parentID" validate:"required,nanoid"`
	ChildID  string `db:"child_id" json:"childID" validate:"required,nanoid"`
}

func IsBuildPreProcessing(status string) bool {
	return status == BUILD_STATUS_UPLOADING || status == BUILD_STATUS_QUEUED_UPLOADING || status == BUILD_STATUS_ABORTED_UPLOADING
}

func IsBuildProcessing(status string) bool {
	return status == BUILD_STATUS_ABORTED_PROCESSING || status == BUILD_STATUS_PROCESSING || status == BUILD_STATUS_QUEUED_PROCESSING
}

func IsBuildPostProcessing(status string) bool {
	return !IsBuildPreProcessing(status) && !IsBuildProcessing(status)
}
