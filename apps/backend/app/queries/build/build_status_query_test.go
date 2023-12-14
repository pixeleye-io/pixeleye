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
			want: "queued-processing",
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
				TargetParentID: "targetParentID",
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
				TargetParentID: "targetParentID",
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
				Status:        "processing",
				TargetBuildID: "targetBuildID",
			},
			want: "unchanged",
		},
		{
			name: "Unreviewed statuses and build with target",
			statuses: []string{
				"unreviewed",
			},
			build: models.Build{
				Status:        "processing",
				TargetBuildID: "targetBuildID",
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
				TargetBuildID:  "targetBuildID",
				TargetParentID: "targetParentID",
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
				TargetBuildID:  "targetBuildID",
				TargetParentID: "targetParentID",
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

			rows := sqlmock.NewRows([]string{"status"})

			for _, status := range tt.statuses {
				rows.AddRow(status)
			}

			mock.ExpectBegin()
			mock.ExpectQuery("SELECT status FROM snapshot WHERE build_id = $1 FOR UPDATE").WillReturnRows(rows)

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

func TestAbortBuild(t *testing.T) {

	tests := []struct {
		name               string
		build              models.Build
		childTargetBuilds  []models.Build
		childParentBuilds  []models.Build
		parentTargetBuilds []models.Build
		parentParentBuilds []models.Build
		want               string
	}{
		{
			name: "Abort build",
			build: models.Build{
				Status:        "processing",
				TargetBuildID: "",
			},
			want: "aborted",
		},
		{
			name: "Abort build with target build",
			build: models.Build{
				Status:        "processing",
				TargetBuildID: "targetBuildID",
			},
			want: "aborted",
		},
		{
			name: "Abort build with target build and child target builds",
			build: models.Build{
				Status: "processing",
				ID:     "abortBuildID",
			},
			childTargetBuilds: []models.Build{
				{
					ID:             "childTargetBuildID",
					TargetBuildID:  "abortBuildID",
					TargetParentID: "abortBuildID",
					Status:         "queued-processing",
				},
			},
		},
		{
			name: "Abort build with target build and child parent builds",
			build: models.Build{
				Status: "processing",
				ID:     "abortBuildID",
			},
			childParentBuilds: []models.Build{
				{
					ID:             "childParentBuildID",
					TargetBuildID:  "abortBuildID",
					TargetParentID: "abortBuildID",
					Status:         "queued-processing",
				},
			},
		},
		{
			name: "Abort build with target build and child target builds and child parent builds",
			build: models.Build{
				Status: "processing",
				ID:     "abortBuildID",
			},
			childTargetBuilds: []models.Build{
				{
					ID:             "childTargetBuildID",
					TargetBuildID:  "abortBuildID",
					TargetParentID: "abortBuildID",
					Status:         "queued-processing",
				},
			},
			childParentBuilds: []models.Build{
				{
					ID:             "childParentBuildID",
					TargetBuildID:  "abortBuildID",
					TargetParentID: "abortBuildID",
					Status:         "queued-processing",
				},
			},
		},
		{
			name: "Abort build with target build and parent target builds",
			build: models.Build{
				Status: "processing",
				ID:     "abortBuildID",
			},
			parentTargetBuilds: []models.Build{
				{
					ID:             "parentTargetBuildID",
					TargetBuildID:  "",
					TargetParentID: "",
					Status:         "processing",
				},
			},
		},
		{
			name: "Abort build with target build and parent parent builds",
			build: models.Build{
				Status: "processing",
				ID:     "abortBuildID",
			},
			parentParentBuilds: []models.Build{
				{
					ID:             "parentParentBuildID",
					TargetBuildID:  "",
					TargetParentID: "",
					Status:         "processing",
				},
			},
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

			mock.ExpectBegin()
			mock.ExpectExec("UPDATE build SET status = $1 WHERE id = $2").WithArgs(models.BUILD_STATUS_ABORTED, tt.build.ID).WillReturnResult(sqlmock.NewResult(1, 1))

			targetRows := sqlmock.NewRows([]string{"id", "target_build_id", "target_parent_id", "status"})
			for _, childTargetBuild := range tt.childTargetBuilds {
				targetRows.AddRow(childTargetBuild.ID, childTargetBuild.TargetBuildID, childTargetBuild.TargetParentID, childTargetBuild.Status)
			}
			mock.ExpectQuery("UPDATE build SET target_build_id = $1 WHERE target_build_id = $2 RETURNING id, target_build_id, target_parent_id, status").WithArgs(tt.build.TargetBuildID, tt.build.ID).WillReturnRows(targetRows)

			parentRows := sqlmock.NewRows([]string{"id", "target_build_id", "target_parent_id", "status"})
			for _, childParentBuild := range tt.childParentBuilds {
				parentRows.AddRow(childParentBuild.ID, childParentBuild.TargetBuildID, childParentBuild.TargetParentID, childParentBuild.Status)
			}
			mock.ExpectQuery("UPDATE build SET target_parent_id = $1 WHERE target_parent_id = $2 RETURNING id, target_build_id, target_parent_id, status").WithArgs(tt.build.TargetParentID, tt.build.ID).WillReturnRows(parentRows)

			mock.ExpectCommit()

			// for i := 0; i < len(tt.childParentBuilds)+len(tt.childTargetBuilds); i++ {
			// 	mock.ExpectQuery("SELECT build.*, NOT EXISTS(SELECT build.id FROM build WHERE target_parent_id = $1) AS is_latest FROM build WHERE id = $1").
			// 		WithArgs(tt.build.ID).WillReturnRows(sqlmock.NewRows([]string{"id", "target_build_id", "status"}).AddRow(tt.build.TargetParentID, tt.build.TargetBuildID, "aborted"))

			// 	mock.ExpectQuery("SELECT build.*, NOT EXISTS(SELECT build.id FROM build WHERE target_parent_id = $1) AS is_latest FROM build WHERE id = $1").
			// 		WithArgs(tt.build.ID).WillReturnRows(sqlmock.NewRows([]string{"id", "target_build_id", "status"}).AddRow(tt.build.TargetBuildID, tt.build.TargetBuildID, "aborted"))
			// }

			// for i := 0; i < len(tt.childParentBuilds)+len(tt.childTargetBuilds); i++ {
			// 	var build models.Build
			// 	if i < len(tt.childParentBuilds) {
			// 		build = tt.childParentBuilds[i]
			// 	} else {
			// 		build = tt.childTargetBuilds[i-len(tt.childParentBuilds)]
			// 	}

			// 	mock.ExpectBegin()

			// 	mock.ExpectQuery("SELECT * FROM snapshot WHERE build_id = $1 AND status = $2 FOR UPDATE").WithArgs(build.ID, models.SNAPSHOT_STATUS_QUEUED).WillReturnRows(sqlmock.NewRows([]string{"id", "status"}))

			// 	mock.ExpectExec("UPDATE build SET status = ?, target_build_id = ?, target_parent_id = ?, updated_at = ? WHERE id = ?").WithArgs(models.BUILD_STATUS_PROCESSING, tt.build.TargetBuildID, tt.build.TargetParentID, sqlmock.AnyArg(), build.ID).WillReturnResult(sqlmock.NewResult(1, 1))
			// 	mock.ExpectCommit()
			// }

			ctx := context.Background()

			db := BuildQueries{sqlxDB}

			if err != nil {
				t.Errorf("AbortBuild() = %v, want %v", err, tt.want)
			}

			if err := db.AbortBuild(ctx, tt.build); err != nil {
				t.Errorf("AbortBuild() = %v, want %v", err, tt.want)
			}

		})
	}
}
