package build_queries

import (
	"testing"
)

func TestGetBuildStatusFromSnapshotStatuses(t *testing.T) {
	tests := []struct {
		name     string
		statuses []string
		want     string
	}{
		{
			name:     "Empty statuses",
			statuses: []string{},
			want:     "unchanged",
		},
		{
			name: "All statuses",
			statuses: []string{
				"failed",
				"queued",
				"processing",
				"unreviewed",
				"rejected",
				"approved",
				"unchanged",
				"orphaned",
			},
			want: "failed",
		},
		{
			name: "All statuses except failed",
			statuses: []string{
				"queued",
				"processing",
				"unreviewed",
				"rejected",
				"approved",
				"unchanged",
				"orphaned",
			},
			want: "processing",
		},
		{
			name: "All statuses except failed and queued",
			statuses: []string{
				"processing",
				"unreviewed",
				"rejected",
				"approved",
				"unchanged",
				"orphaned",
			},
			want: "processing",
		},
		{
			name: "All statuses except failed, queued and processing",
			statuses: []string{
				"unreviewed",
				"rejected",
				"approved",
				"unchanged",
				"orphaned",
			},
			want: "unreviewed",
		},
		{
			name: "All statuses except failed, queued, processing and unreviewed",
			statuses: []string{
				"rejected",
				"approved",
				"unchanged",
				"orphaned",
			},
			want: "rejected",
		},
		{
			name: "All statuses except failed, queued, processing, unreviewed and rejected",
			statuses: []string{
				"approved",
				"unchanged",
				"orphaned",
			},
			want: "approved",
		},
		{
			name: "All statuses except failed, queued, processing, unreviewed, rejected and approved",
			statuses: []string{
				"unchanged",
				"orphaned",
			},
			want: "unchanged",
		},
		{
			name: "All statuses except failed, queued, processing, unreviewed, rejected, approved and unchanged",
			statuses: []string{
				"orphaned",
			},
			want: "orphaned",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := getBuildStatusFromSnapshotStatuses(tt.statuses); got != tt.want {
				t.Errorf("GetBuildStatusFromSnapshotStatuses() = %v, want %v", got, tt.want)
			}
		})
	}
}
