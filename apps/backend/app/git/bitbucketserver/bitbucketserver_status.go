package git_bitbucketserver

import (
	"context"
	"fmt"

	"github.com/pixeleye-io/pixeleye/app/git/vcsstatus"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/platform/database"
)

type buildStatusPayload struct {
	Key         string `json:"key"`
	State       string `json:"state"`
	URL         string `json:"url"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

func getBitbucketServerStatus(status string) string {
	switch vcsstatus.GetStatus(status) {
	case "error", "failure":
		return "FAILED"
	case "success":
		return "SUCCESSFUL"
	default:
		return "INPROGRESS"
	}
}

// SyncBuildStatusWithBitbucketServer posts a build status via Bitbucket Server's Build
// Status REST API (bundled since Bitbucket Server 4.10).
func SyncBuildStatusWithBitbucketServer(ctx context.Context, project models.Project, build models.Build) error {
	if project.Source != models.SOURCE_BITBUCKET_SERVER {
		return nil
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	client, err := NewBitbucketServerClient(ctx, project.TeamID)
	if err != nil {
		return err
	}

	team, err := db.GetTeamByID(ctx, project.TeamID)
	if err != nil {
		return err
	}

	payload := buildStatusPayload{
		Key:         "pixeleye",
		State:       getBitbucketServerStatus(build.Status),
		URL:         vcsstatus.GetDetailsURL(build),
		Name:        fmt.Sprintf("Pixeleye – %s/%s", team.Name, project.Name),
		Description: fmt.Sprintf("Build status: %s", vcsstatus.GetBuildStatusTitle(build.Status)),
	}

	path := fmt.Sprintf("/rest/build-status/1.0/commits/%s", build.Sha)

	return client.post(ctx, path, payload)
}
