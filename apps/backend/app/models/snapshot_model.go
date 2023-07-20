package models

import (
	"time"

	"github.com/google/uuid"
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
	ID        uuid.UUID `db:"id" json:"id" validate:"required,uuid"`
	CreatedAt time.Time `db:"created_at" json:"createAt"`
	UpdatedAt time.Time `db:"updated_at" json:"updatedAt"`

	BuildID uuid.UUID `db:"build_id" json:"build_id" validate:"required"`
	Name    string    `db:"name" json:"name" validate:"required"`
	Variant string    `db:"variant" json:"variant"`
	Target  string    `db:"target" json:"target"`
	URL     string    `db:"url" json:"url" validate:"required"`

	Status string `db:"status" json:"status"`
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
