package models

import (
	"database/sql"
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

	Name     string `db:"name" json:"name" validate:"required"`
	Variant  string `db:"variant" json:"variant,omitempty"`
	Target   string `db:"target" json:"target,omitempty"`
	Viewport string `db:"viewport" json:"viewport,omitempty" validate:"omitempty,viewport"`

	SnapId string         `db:"snap_image_id" json:"snapID" validate:"required"`
	DiffId sql.NullString `db:"diff_image_id" json:"diffID,omitempty"`

	BaselineID sql.NullString `db:"baseline_snapshot_id" json:"baselineID,omitempty" validate:"omitempty,nanoid"`

	Depth int `db:"depth" json:"-"` // Used for sorting when calculating approval history

	Status string `db:"status" json:"status" validate:"required,oneof=processing failed aborted approved rejected unreviewed unchanged orphaned"`

	ReviewerID sql.NullString `db:"reviewer_id" json:"reviewerID,omitempty" validate:"omitempty,nanoid"`
	ReviewedAt *time.Time     `db:"reviewed_at" json:"reviewedAt,omitempty"`
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

	if a.Viewport != b.Viewport {
		return false
	}

	return true

}
