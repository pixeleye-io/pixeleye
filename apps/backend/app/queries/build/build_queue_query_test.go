package build_queries

import (
	"context"
	"testing"

	"github.com/pixeleye-io/pixeleye/app/models"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/jmoiron/sqlx"
)

func TestCheckAndProcessQueuedBuild(t *testing.T) {

	mockDB, mock, err := sqlmock.New(sqlmock.QueryMatcherOption(sqlmock.QueryMatcherEqual))
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}
	defer mockDB.Close()
	sqlxDB := sqlx.NewDb(mockDB, "sqlmock")

	q := &BuildQueries{
		sqlxDB,
	}

	ctx := context.Background()

	t.Run("Parent build is not post-processing", func(t *testing.T) {

		build := models.Build{
			ID:             "buildID",
			Status:         models.BUILD_STATUS_QUEUED_PROCESSING,
			TargetParentID: "parentBuildID",
			TargetBuildID:  "targetBuildID",
		}

		mock.ExpectQuery("SELECT build.*, NOT EXISTS(SELECT build.id FROM build WHERE target_parent_id = $1) AS is_latest FROM build WHERE id = $1").WithArgs(build.TargetParentID).WillReturnRows(sqlmock.NewRows([]string{"id", "status"}).AddRow("parentBuildID", models.BUILD_STATUS_QUEUED_PROCESSING))

		err := q.CheckAndProcessQueuedBuild(ctx, build)
		if err != nil {
			t.Errorf("CheckAndProcessQueuedBuild() error = %v, want nil", err)
		}
	})

	t.Run("Target build is not post-processing but parent build is", func(t *testing.T) {

		build := models.Build{
			ID:             "buildID",
			Status:         models.BUILD_STATUS_QUEUED_PROCESSING,
			TargetParentID: "parentBuildID",
			TargetBuildID:  "targetBuildID",
		}

		mock.ExpectQuery("SELECT build.*, NOT EXISTS(SELECT build.id FROM build WHERE target_parent_id = $1) AS is_latest FROM build WHERE id = $1").WithArgs(build.TargetParentID).WillReturnRows(sqlmock.NewRows([]string{"id", "status"}).AddRow(build.TargetParentID, models.BUILD_STATUS_ORPHANED))
		mock.ExpectQuery("SELECT build.*, NOT EXISTS(SELECT build.id FROM build WHERE target_parent_id = $1) AS is_latest FROM build WHERE id = $1").WithArgs(build.TargetBuildID).WillReturnRows(sqlmock.NewRows([]string{"id", "status"}).AddRow(build.TargetBuildID, models.BUILD_STATUS_PROCESSING))

		err := q.CheckAndProcessQueuedBuild(ctx, build)
		if err != nil {
			t.Errorf("CheckAndProcessQueuedBuild() error = %v, want nil", err)
		}
	})

	t.Run("If build is pre-processing but our target build has failed or aborted, we should update the build", func(t *testing.T) {

		build := models.Build{
			ID:             "buildID",
			Status:         models.BUILD_STATUS_QUEUED_UPLOADING,
			TargetParentID: "parentBuildID",
			TargetBuildID:  "targetBuildID",
		}

		for _, status := range []string{models.BUILD_STATUS_FAILED, models.BUILD_STATUS_ABORTED} {

			mock.ExpectQuery("SELECT build.*, NOT EXISTS(SELECT build.id FROM build WHERE target_parent_id = $1) AS is_latest FROM build WHERE id = $1").WithArgs(build.TargetParentID).WillReturnRows(sqlmock.NewRows([]string{"id", "status"}).AddRow(build.TargetParentID, models.BUILD_STATUS_APPROVED))
			mock.ExpectQuery("SELECT build.*, NOT EXISTS(SELECT build.id FROM build WHERE target_parent_id = $1) AS is_latest FROM build WHERE id = $1").WithArgs(build.TargetBuildID).WillReturnRows(sqlmock.NewRows([]string{"id", "status", "target_build_id"}).AddRow(build.TargetBuildID, status, "new_target_build_id"))

			mock.ExpectBegin()
			mock.ExpectExec("UPDATE build SET status = ?, target_build_id = ?, target_parent_id = ?, updated_at = ? WHERE id = ?").WithArgs(models.BUILD_STATUS_UPLOADING, "new_target_build_id", build.TargetParentID, sqlmock.AnyArg(), build.ID).WillReturnResult(sqlmock.NewResult(1, 1))
			mock.ExpectCommit()

			err := q.CheckAndProcessQueuedBuild(ctx, build)
			if err != nil {
				t.Errorf("CheckAndProcessQueuedBuild() error = %v, want nil", err)
			}
		}
	})

	t.Run("If build is post-processing but our target parent has failed or aborted, we should update the build", func(t *testing.T) {

		build := models.Build{
			ID:             "buildID",
			Status:         models.BUILD_STATUS_QUEUED_UPLOADING,
			TargetParentID: "parentBuildID",
			TargetBuildID:  "targetBuildID",
		}

		for _, status := range []string{models.BUILD_STATUS_FAILED, models.BUILD_STATUS_ABORTED} {

			mock.ExpectQuery("SELECT build.*, NOT EXISTS(SELECT build.id FROM build WHERE target_parent_id = $1) AS is_latest FROM build WHERE id = $1").WithArgs(build.TargetParentID).WillReturnRows(sqlmock.NewRows([]string{"id", "status", "target_parent_id"}).AddRow(build.TargetParentID, status, "new_parent_build_id"))
			mock.ExpectQuery("SELECT build.*, NOT EXISTS(SELECT build.id FROM build WHERE target_parent_id = $1) AS is_latest FROM build WHERE id = $1").WithArgs(build.TargetBuildID).WillReturnRows(sqlmock.NewRows([]string{"id", "status"}).AddRow(build.TargetBuildID, models.BUILD_STATUS_REJECTED))

			mock.ExpectBegin()
			mock.ExpectExec("UPDATE build SET status = ?, target_build_id = ?, target_parent_id = ?, updated_at = ? WHERE id = ?").WithArgs(models.BUILD_STATUS_UPLOADING, build.TargetBuildID, "new_parent_build_id", sqlmock.AnyArg(), build.ID).WillReturnResult(sqlmock.NewResult(1, 1))
			mock.ExpectCommit()

			err := q.CheckAndProcessQueuedBuild(ctx, build)
			if err != nil {
				t.Errorf("CheckAndProcessQueuedBuild() error = %v, want nil", err)
			}
		}
	})

	t.Run("If build is processing and our parents are post-processing, we should get our queued snapshots, start processing them and update the build", func(t *testing.T) {

		build := models.Build{
			ID:             "buildID",
			Status:         models.BUILD_STATUS_QUEUED_PROCESSING,
			TargetParentID: "parentBuildID",
			TargetBuildID:  "targetBuildID",
		}

		mock.ExpectQuery("SELECT build.*, NOT EXISTS(SELECT build.id FROM build WHERE target_parent_id = $1) AS is_latest FROM build WHERE id = $1").WithArgs(build.TargetParentID).WillReturnRows(sqlmock.NewRows([]string{"id", "status"}).AddRow(build.TargetParentID, models.BUILD_STATUS_APPROVED))
		mock.ExpectQuery("SELECT build.*, NOT EXISTS(SELECT build.id FROM build WHERE target_parent_id = $1) AS is_latest FROM build WHERE id = $1").WithArgs(build.TargetBuildID).WillReturnRows(sqlmock.NewRows([]string{"id", "status"}).AddRow(build.TargetBuildID, models.BUILD_STATUS_APPROVED))

		mock.ExpectBegin()
		mock.ExpectQuery("SELECT * FROM snapshot WHERE build_id = $1 AND status = $2 FOR UPDATE").WithArgs(build.ID, models.SNAPSHOT_STATUS_QUEUED).WillReturnRows(sqlmock.NewRows([]string{"id", "status"}).AddRow("snapshotID", models.SNAPSHOT_STATUS_QUEUED))
		mock.ExpectExec("UPDATE build SET status = ?, target_build_id = ?, target_parent_id = ?, updated_at = ? WHERE id = ?").WithArgs(models.BUILD_STATUS_PROCESSING, build.TargetBuildID, build.TargetParentID, sqlmock.AnyArg(), build.ID).WillReturnResult(sqlmock.NewResult(1, 1))
		mock.ExpectExec("UPDATE snapshot SET status = ?, updated_at = ? WHERE id IN (?)").WithArgs(models.SNAPSHOT_STATUS_PROCESSING, sqlmock.AnyArg(), "snapshotID").WillReturnResult(sqlmock.NewResult(1, 1))
		mock.ExpectCommit()

		err := q.CheckAndProcessQueuedBuild(ctx, build)
		if err != nil {
			t.Errorf("CheckAndProcessQueuedBuild() error = %v, want nil", err)
		}
	})

}
