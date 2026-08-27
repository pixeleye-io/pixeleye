// Package vcsstatus holds VCS-agnostic build status helpers shared by the provider
// packages (app/git/github, app/git/bitbucket, app/git/bitbucketserver). It's a leaf
// package with no dependency on app/git itself, since those provider packages are in turn
// imported by app/git's dispatch functions - importing app/git from here would cycle.
package vcsstatus

import (
	"os"

	"github.com/pixeleye-io/pixeleye/app/models"
)

// GetStatus maps a Pixeleye build status to the tri-state (pending/success/error or
// failure) status most VCS commit-status APIs expect.
func GetStatus(status string) string {
	if models.IsBuildFailedOrAborted(status) {
		return "error"
	}

	if models.IsBuildPostProcessing(status) {
		if status == models.BUILD_STATUS_ORPHANED || status == models.BUILD_STATUS_UNCHANGED || status == models.BUILD_STATUS_APPROVED {
			return "success"
		}
		return "failure"
	}

	return "pending"
}

func GetBuildStatusTitle(status string) string {
	switch status {
	case models.BUILD_STATUS_APPROVED:
		return "Approved"
	case models.BUILD_STATUS_REJECTED:
		return "Rejected"
	case models.BUILD_STATUS_UNREVIEWED:
		return "Unreviewed"
	case models.BUILD_STATUS_FAILED:
		return "Failed"
	case models.BUILD_STATUS_ORPHANED:
		return "Orphaned"
	case models.BUILD_STATUS_UNCHANGED:
		return "Unchanged"
	case models.BUILD_STATUS_ABORTED:
		return "Aborted"
	case models.BUILD_STATUS_PROCESSING:
		return "Processing"
	case models.BUILD_STATUS_QUEUED_PROCESSING:
		return "Queued for processing"
	case models.BUILD_STATUS_QUEUED_UPLOADING:
		return "Queued for uploading"
	case models.BUILD_STATUS_UPLOADING:
		return "Uploading"
	default:
		return "Processing"
	}
}

func GetDetailsURL(build models.Build) string {
	return os.Getenv("FRONTEND_URL") + "/builds/" + build.ID
}
