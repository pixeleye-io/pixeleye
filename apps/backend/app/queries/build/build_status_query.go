package build_queries

import (
	"context"

	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
)

// Snapshot status to order map
// nolint: gochecknoglobals
var snapshotStatusMap = map[string]int{
	models.SNAPSHOT_STATUS_FAILED:           0,
	models.SNAPSHOT_STATUS_QUEUED:           1,
	models.SNAPSHOT_STATUS_PROCESSING:       2,
	models.SNAPSHOT_STATUS_UNREVIEWED:       3,
	models.SNAPSHOT_STATUS_REJECTED:         4,
	models.SNAPSHOT_STATUS_APPROVED:         5,
	models.SNAPSHOT_STATUS_UNCHANGED:        6,
	models.SNAPSHOT_STATUS_MISSING_BASELINE: 7,
	models.SNAPSHOT_STATUS_ORPHANED:         8,
	"unknown":                               9,
}

// We assume that builds are past the preProcessing stage
func getBuildStatusFromSnapshotStatuses(statuses []string) string {
	worstStatus := "unknown"

	for _, status := range statuses {
		if snapshotStatusMap[status] < snapshotStatusMap[worstStatus] {
			worstStatus = status
		}
	}

	switch worstStatus {
	case models.SNAPSHOT_STATUS_FAILED:
		return models.BUILD_STATUS_FAILED
	case models.SNAPSHOT_STATUS_QUEUED:
		return models.BUILD_STATUS_PROCESSING
	case models.SNAPSHOT_STATUS_PROCESSING:
		return models.BUILD_STATUS_PROCESSING
	case models.SNAPSHOT_STATUS_UNREVIEWED:
		return models.BUILD_STATUS_UNREVIEWED
	case models.SNAPSHOT_STATUS_REJECTED:
		return models.BUILD_STATUS_REJECTED
	case models.SNAPSHOT_STATUS_APPROVED:
		return models.BUILD_STATUS_APPROVED
	case models.SNAPSHOT_STATUS_UNCHANGED:
		return models.BUILD_STATUS_UNCHANGED
	case models.SNAPSHOT_STATUS_MISSING_BASELINE:
		return models.BUILD_STATUS_UNCHANGED
	case models.SNAPSHOT_STATUS_ORPHANED:
		return models.BUILD_STATUS_ORPHANED
	default:
		return models.BUILD_STATUS_UNCHANGED
	}
}

func (q *BuildQueries) UpdateBuildStatus(ctx context.Context, build *models.Build, status string) error {

	// NOTE: We don't worry about updating the children here since we take care of that when we process the queued builds

	build.Status = status
	build.UpdatedAt = utils.CurrentTime()

	query := `UPDATE build SET status = :status, updated_at = :updated_at WHERE id = :id`

	if _, err := q.NamedExecContext(ctx, query, build); err != nil {
		return err
	}

	return nil
}

func (q *BuildQueries) GetBuildDirectDependents(ctx context.Context, build models.Build) ([]models.Build, error) {

	childrenBuilds, err := q.GetDirectBuildChildren(ctx, build.ID)
	if err != nil {
		return nil, err
	}

	targeterBuilds, err := q.GetDirectBuildTargeters(ctx, build.ID)
	if err != nil {
		return nil, err
	}

	return append(childrenBuilds, targeterBuilds...), nil
}

func (q *BuildQueries) GetBuildDependencies(ctx context.Context, build models.Build) ([]models.Build, error) {

	parentBuilds, err := q.GetBuildParents(ctx, build.ID, nil)
	if err != nil {
		return nil, err
	}

	targetBuilds, err := q.GetBuildTargets(ctx, build.ID, nil)
	if err != nil {
		return nil, err
	}

	return append(parentBuilds, targetBuilds...), nil
}

func (q *BuildQueries) AreBuildDependenciesPostProcessing(ctx context.Context, build models.Build) (bool, error) {

	builds, err := q.GetBuildDependencies(ctx, build)
	if err != nil {
		return false, err
	}

	for _, build := range builds {
		if !models.IsBuildPostProcessing(build.Status) {
			return false, nil
		}
	}

	return true, nil
}

// CalculateBuildStatus
func (tx *BuildQueriesTx) CalculateBuildStatusFromSnapshotsIgnoringQueued(ctx context.Context, build models.Build) (string, error) {
	selectSnapshotsQuery := `SELECT status FROM snapshot WHERE build_id = $1 FOR UPDATE`

	if models.IsBuildPreProcessing(build.Status) || models.IsBuildFailedOrAborted(build.Status) || models.IsBuildQueued(build.Status) {
		return build.Status, nil
	}

	snapshotStatus := []string{}

	if err := tx.SelectContext(ctx, &snapshotStatus, selectSnapshotsQuery, build.ID); err != nil {
		return build.Status, err
	}

	if len(snapshotStatus) == 0 {
		return models.BUILD_STATUS_UNCHANGED, nil
	}

	filtered := []string{}
	for _, status := range snapshotStatus {
		if status != models.SNAPSHOT_STATUS_QUEUED {
			filtered = append(filtered, status)
		}
	}

	if len(filtered) == 0 {
		return models.BUILD_STATUS_PROCESSING, nil
	}

	return getBuildStatusFromSnapshotStatuses(filtered), nil
}
