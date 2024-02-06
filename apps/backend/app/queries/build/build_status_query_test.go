package build_queries

import (
	"context"
	"testing"

	"github.com/jmoiron/sqlx"
	"github.com/pixeleye-io/pixeleye/app/models"

	"github.com/DATA-DOG/go-sqlmock"
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

func TestCalculateBuildStatus(t *testing.T) {

	tests := []struct {
		name     string
		statuses []string
		build    models.Build
		want     string
	}{
		{
			name:     "Empty statuses and uploading build",
			statuses: []string{},
			build: models.Build{
				Status: "uploading",
			},
			want: "uploading",
		},
		{
			name: "Missing baseline statuses",
			statuses: []string{
				"missing_baseline",
			},
			build: models.Build{
				Status:         "processing",
				TargetBuildIDs: []string{"targetBuildID"},
			},
			want: "unchanged",
		},
		{
			name: "Failed statuses and uploading build",
			statuses: []string{
				"failed",
			},
			want: "uploading",
			build: models.Build{
				Status: "uploading",
			},
		},
		{
			name:     "Empty statuses and queued-uploading build",
			statuses: []string{},
			build: models.Build{
				Status: "queued-uploading",
			},
			want: "queued-uploading",
		},
		{
			name: "Rejected statuses and processing build",
			statuses: []string{
				"rejected",
			},
			build: models.Build{
				Status:         "processing",
				TargetBuildIDs: []string{"targetBuildID"},
			},
			want: "rejected",
		},
		{
			name:     "Empty statuses and aborted build",
			statuses: []string{},
			build: models.Build{
				Status: "aborted",
			},
			want: "aborted",
		},
		{
			name: "Approved statuses and aborted build",
			statuses: []string{
				"approved",
			},
			build: models.Build{
				Status: "aborted",
			},
			want: "aborted",
		},
		{
			name:     "Empty statuses and build with no target",
			statuses: []string{},
			build: models.Build{
				Status: "unchanged",
			},
			want: "orphaned",
		},
		{
			name: "Unreviewed statuses and build with no target",
			statuses: []string{
				"unreviewed",
			},
			build: models.Build{
				Status: "unchanged",
			},
			want: "orphaned",
		},
		{
			name:     "Empty statuses and build with target",
			statuses: []string{},
			build: models.Build{
				Status:         "processing",
				TargetBuildIDs: []string{"targetBuildID"},
			},
			want: "unchanged",
		},
		{
			name: "Unreviewed statuses and build with target",
			statuses: []string{
				"unreviewed",
			},
			build: models.Build{
				Status:         "processing",
				TargetBuildIDs: []string{"targetBuildID"},
			},
			want: "unreviewed",
		},
		{
			name: "Unreviewed statuses and build with target and parent",
			statuses: []string{
				"unreviewed",
			},
			build: models.Build{
				Status:         "processing",
				TargetBuildIDs: []string{"targetBuildID"},
			},
			want: "unreviewed",
		},
		{
			name: "Unreviewed statuses and build with target and parent and rejected build status parent",
			statuses: []string{
				"unreviewed",
			},
			build: models.Build{
				Status:         "failed",
				TargetBuildIDs: []string{"targetBuildID"},
			},
			want: "failed",
		},
	}

	for _, tt := range tests {

		mockDB, mock, err := sqlmock.New(sqlmock.QueryMatcherOption(sqlmock.QueryMatcherEqual))
		if err != nil {
			t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
		}
		defer mockDB.Close()
		sqlxDB := sqlx.NewDb(mockDB, "sqlmock")

		t.Run(tt.name, func(t *testing.T) {

			statusRows := sqlmock.NewRows([]string{"status"})

			for _, status := range tt.statuses {
				statusRows.AddRow(status)
			}

			targetRows := sqlmock.NewRows([]string{"id"})
			for _, targetBuildID := range tt.build.TargetBuildIDs {
				targetRows.AddRow(targetBuildID)
			}

			mock.ExpectBegin()
			mock.ExpectQuery("SELECT status FROM snapshot WHERE build_id = $1 FOR UPDATE").WillReturnRows(statusRows)
			mock.ExpectQuery("SELECT build.* FROM build JOIN build_targets ON build_targets.target_id = build.id WHERE build_targets.build_id = $1 AND build.status != 'aborted' AND build.status != 'failed'").WillReturnRows(targetRows)
			mock.ExpectQuery("SELECT build.* FROM build JOIN build_history ON build_history.parent_id = build.id WHERE build_history.child_id = $1 AND build.status != 'aborted' AND build.status != 'failed'")

			ctx := context.Background()

			tx, err := NewBuildTx(sqlxDB, ctx)

			if err != nil {
				t.Errorf("CalculateBuildStatus() = %v, want %v", err, tt.want)
			}

			// nolint:errcheck
			defer tx.Rollback()

			if got, err := tx.CalculateBuildStatus(ctx, tt.build); got != tt.want || err != nil {
				t.Errorf("CalculateBuildStatus() = %v, want %v, error %v", got, tt.want, err)
			}

		})
	}
}
