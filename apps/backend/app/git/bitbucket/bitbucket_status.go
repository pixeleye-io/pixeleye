package git_bitbucket

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

func getBitbucketStatus(status string) string {
	switch vcsstatus.GetStatus(status) {
	case "error", "failure":
		return "FAILED"
	case "success":
		return "SUCCESSFUL"
	default:
		return "INPROGRESS"
	}
}

func SyncBuildStatusWithBitbucket(ctx context.Context, project models.Project, build models.Build) error {
	if project.Source != models.SOURCE_BITBUCKET {
		return nil
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	installation, err := db.GetGitInstallation(ctx, project.TeamID, models.TEAM_TYPE_BITBUCKET)
	if err != nil {
		return err
	}

	client, err := NewBitbucketCloudClient(ctx, installation.InstallationID)
	if err != nil {
		return err
	}

	team, err := db.GetTeamByID(ctx, project.TeamID)
	if err != nil {
		return err
	}

	workspace, repoSlug, err := splitFullName(project.SourceID)
	if err != nil {
		return err
	}

	payload := buildStatusPayload{
		Key:         "pixeleye",
		State:       getBitbucketStatus(build.Status),
		URL:         vcsstatus.GetDetailsURL(build),
		Name:        fmt.Sprintf("Pixeleye – %s/%s", team.Name, project.Name),
		Description: fmt.Sprintf("Build status: %s", vcsstatus.GetBuildStatusTitle(build.Status)),
	}

	path := fmt.Sprintf("/repositories/%s/%s/commit/%s/statuses/build", workspace, repoSlug, build.Sha)

	return client.post(ctx, path, payload)
}
