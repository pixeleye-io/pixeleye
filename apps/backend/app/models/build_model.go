package models

import (
	"time"

	"github.com/lib/pq"
)

const (
	BUILD_STATUS_UPLOADING         = "uploading"
	BUILD_STATUS_QUEUED_UPLOADING  = "queued-uploading"
	BUILD_STATUS_QUEUED_PROCESSING = "queued-processing"
	BUILD_STATUS_PROCESSING        = "processing"
	BUILD_STATUS_FAILED            = "failed"
	BUILD_STATUS_ABORTED           = "aborted"
	BUILD_STATUS_APPROVED          = "approved"
	BUILD_STATUS_REJECTED          = "rejected"
	BUILD_STATUS_UNREVIEWED        = "unreviewed"
	BUILD_STATUS_UNCHANGED         = "unchanged"
	BUILD_STATUS_ORPHANED          = "orphaned"
)

// Build struct for build model.
type Build struct {
	ID        string    `db:"id" json:"id" validate:"required,nanoid"`
	CreatedAt time.Time `db:"created_at" json:"createdAt"`
	UpdatedAt time.Time `db:"updated_at" json:"updatedAt"`

	ProjectID string `db:"project_id" json:"projectID" validate:"required,nanoid"`

	BuildNumber int `db:"build_number" json:"buildNumber"`

	ParentIDs      []string `json:"parentIDs,omitempty" validate:"omitempty,dive,nanoid"`
	TargetBuildIDs []string `json:"targetBuildIDs,omitempty" validate:"omitempty,dive,nanoid"`

	IsLatest bool `db:"is_latest" json:"isLatest"`

	ShardCount      int    `db:"shard_count" json:"shardCount,omitempty" validate:"omitempty,min=1"`
	ShardingID      string `db:"sharding_id" json:"shardingID,omitempty" validate:"omitempty,min=8"`
	ShardsCompleted int    `db:"shards_completed" json:"shardsCompleted,omitempty" validate:"omitempty,min=0"`

	Sha                string         `db:"sha" json:"sha" validate:"required"`
	Branch             string         `db:"branch" json:"branch" validate:"required"`
	Title              string         `db:"title" json:"title,omitempty"`
	Message            string         `db:"message" json:"message,omitempty"`
	Status             string         `db:"status" json:"status" validate:"required,oneof=uploading processing failed aborted approved rejected unreviewed unchanged orphaned queued-uploading queued-processing"`
	Errors             pq.StringArray `db:"errors" json:"errors,omitempty"`
	Warnings           pq.StringArray `db:"warnings" json:"warnings,omitempty"`
	DeletedSnapshotIDs pq.StringArray `db:"deleted_snapshot_ids" json:"deletedSnapshotIDs,omitempty"`

	CheckRunID string `db:"check_run_id" json:"checkRunID,omitempty"`

	PrID         string `db:"pr_id" json:"prID,omitempty"`
	TargetBranch string `db:"target_branch" json:"targetBranch,omitempty"`
}

type BuildHistory struct {
	ParentID string `db:"parent_id" json:"parentID" validate:"required,nanoid"`
	ChildID  string `db:"child_id" json:"childID" validate:"required,nanoid"`
}

type BuildTarget struct {
	BuildID  string `db:"build_id" json:"buildID" validate:"required,nanoid"`
	TargetID string `db:"target_id" json:"targetID" validate:"required,nanoid"`
}

func IsBuildPreProcessing(status string) bool {
	return status == BUILD_STATUS_UPLOADING || status == BUILD_STATUS_QUEUED_UPLOADING
}

func IsBuildProcessing(status string) bool {
	return status == BUILD_STATUS_PROCESSING || status == BUILD_STATUS_QUEUED_PROCESSING
}

func IsBuildPostProcessing(status string) bool {
	return !IsBuildPreProcessing(status) && !IsBuildProcessing(status)
}

func IsBuildFailedOrAborted(status string) bool {
	return status == BUILD_STATUS_FAILED || status == BUILD_STATUS_ABORTED
}

func IsBuildQueued(status string) bool {
	return status == BUILD_STATUS_QUEUED_UPLOADING || status == BUILD_STATUS_QUEUED_PROCESSING
}
