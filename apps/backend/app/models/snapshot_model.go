package models

import (
	"time"
)

const (
	SNAPSHOT_STATUS_PROCESSING = "processing"
	SNAPSHOT_STATUS_FAILED     = "failed"
	SNAPSHOT_STATUS_ABORTED    = "aborted"
	SNAPSHOT_STATUS_APPROVED   = "approved"
	SNAPSHOT_STATUS_REJECTED   = "rejected"
	SNAPSHOT_STATUS_UNREVIEWED = "unreviewed"
	SNAPSHOT_STATUS_UNCHANGED  = "unchanged"
	SNAPSHOT_STATUS_ORPHANED   = "orphaned"
)

type Snapshot struct {
	ID        string    `db:"id" json:"id" validate:"required,nanoid"`
	CreatedAt time.Time `db:"created_at" json:"createdAt"`
	UpdatedAt time.Time `db:"updated_at" json:"updatedAt"`

	BuildID string `db:"build_id" json:"buildID" validate:"required,nanoid"`

	Name    string `db:"name" json:"name" validate:"required"`
	Variant string `db:"variant" json:"variant,omitempty"`
	Target  string `db:"target" json:"target,omitempty"`

	SnapId string `db:"snap_image_id" json:"snapID" validate:"required"`
	DiffId string `db:"diff_image_id" json:"diffID,omitempty"`

	BaselineID string `db:"baseline_snapshot_id" json:"baselineID,omitempty" validate:"nanoid"`

	Status string `db:"status" json:"status" validate:"required,oneof=processing failed aborted approved rejected unreviewed unchanged orphaned"`

	ReviewerID string     `db:"reviewer_id" json:"reviewerID,omitempty" validate:"nanoid"`
	ReviewAt   *time.Time `db:"review_at" json:"reviewAt,omitempty"`
}

func CompareSnaps(a Snapshot, b Snapshot) bool {
	if a.Name != b.Name {
		return false
	}

	if a.Variant != b.Variant {
		return false
	}

	if a.Target != b.Target {
		return false
	}

	return true

}
