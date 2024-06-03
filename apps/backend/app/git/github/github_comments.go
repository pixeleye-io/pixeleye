package git_github

import (
	"context"
	"fmt"
	"os"
	"strconv"

	"github.com/google/go-github/v62/github"
	"github.com/rs/zerolog/log"

	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/platform/database"
)

func getStatus(status string) string {

	if models.IsBuildFailedOrAborted(status) {
		return "error"
	}

	if models.IsBuildPostProcessing(status) {
		if status == models.BUILD_STATUS_ORPHANED || status == models.BUILD_STATUS_UNCHANGED || status == models.BUILD_STATUS_APPROVED {
			return "success"
		} else {
			return "failure"
		}
	}

	return "pending"
}

func (c *GithubAppClient) createCheckRun(ctx context.Context, team models.Team, project models.Project, build models.Build) error {

	if project.Source != "github" {
		return fmt.Errorf("project source is not from github")
	}

	repoID, err := strconv.ParseInt(project.SourceID, 10, 64)
	if err != nil {
		return err
	}

	repo, _, err := c.Repositories.GetByID(ctx, repoID)
	if err != nil {
		return err
	}

	detailsURL := getDetailsURL(build)

	status := getStatus(build.Status)

	description := fmt.Sprintf("Pixeleye — %s/%s: %s %s", team.Name, project.Name, getStatusEmoji(build.Status), getBuildStatusTitle(build.Status))

	_, _, err = c.Repositories.CreateStatus(ctx, repo.Owner.GetLogin(), repo.GetName(), build.Sha, &github.RepoStatus{
		TargetURL:   &detailsURL,
		State:       &status,
		Description: &description,
	})

	return err
}

func getStatusEmoji(status string) string {
	switch status {
	case models.BUILD_STATUS_APPROVED:
		return "🟢"
	case models.BUILD_STATUS_REJECTED:
		return "🟠"
	case models.BUILD_STATUS_UNREVIEWED:
		return "🟡"
	case models.BUILD_STATUS_FAILED:
		return "🔴"
	case models.BUILD_STATUS_ORPHANED:
		return "⚪️"
	case models.BUILD_STATUS_UNCHANGED:
		return "🟢"
	case models.BUILD_STATUS_ABORTED:
		return "🔴"
	case models.BUILD_STATUS_PROCESSING:
		return "🔵"
	case models.BUILD_STATUS_QUEUED_PROCESSING:
		return "🔵"
	case models.BUILD_STATUS_QUEUED_UPLOADING:
		return "🔵"
	case models.BUILD_STATUS_UPLOADING:
		return "🔵"
	default:
		return "🔵"
	}
}

func getBuildStatusTitle(status string) string {
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

func getDetailsURL(build models.Build) string {
	return os.Getenv("FRONTEND_URL") + "/builds/" + build.ID
}

func (c *GithubAppClient) updateCheckRun(ctx context.Context, team models.Team, project models.Project, build models.Build) error {

	if project.Source != "github" {
		return fmt.Errorf("project source is not from github")
	}

	repoID, err := strconv.ParseInt(project.SourceID, 10, 64)
	if err != nil {
		return err
	}

	repo, _, err := c.Repositories.GetByID(ctx, repoID)
	if err != nil {
		return err
	}

	status := getStatus(build.Status)

	detailsURL := getDetailsURL(build)

	description := fmt.Sprintf("Pixeleye — %s/%s: %s %s", team.Name, project.Name, getStatusEmoji(build.Status), getBuildStatusTitle(build.Status))

	_, _, err = c.Repositories.CreateStatus(ctx, repo.Owner.GetLogin(), repo.GetName(), build.Sha, &github.RepoStatus{
		TargetURL:   &detailsURL,
		State:       &status,
		Description: &description,
	})
	if err != nil {
		return err
	}

	return nil
}

func SyncBuildStatusWithGithub(ctx context.Context, project models.Project, build models.Build) error {

	if project.Source != "github" {
		return nil
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	installation, err := db.GetGitInstallation(ctx, project.TeamID, models.TEAM_TYPE_GITHUB)
	if err != nil {
		return err
	}

	githubAppClient, err := NewGithubInstallClient(installation.InstallationID)
	if err != nil {
		return err
	}

	team, err := db.GetTeamByID(ctx, project.TeamID)
	if err != nil {
		return err
	}

	if err := githubAppClient.createCheckRun(ctx, team, project, build); err != nil {
		log.Error().Err(err).Msg("Failed to create check run")
		return err
	}

	return nil
}
