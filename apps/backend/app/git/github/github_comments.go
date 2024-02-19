package git_github

import (
	"context"
	"fmt"
	"os"
	"strconv"

	"github.com/google/go-github/v59/github"
	"github.com/rs/zerolog/log"

	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/platform/database"
)

func getStatus(status string) string {
	if models.IsBuildPostProcessing(status) {
		return "completed"
	}

	if models.IsBuildQueued(status) {
		return "queued"
	}

	return "in_progress"
}

func getConclusion(build models.Build) string {
	if build.Status == models.BUILD_STATUS_FAILED || build.Status == models.BUILD_STATUS_REJECTED {
		return "failure"
	}

	if build.Status == models.BUILD_STATUS_ABORTED {
		return "cancelled"
	}

	if build.Status == models.BUILD_STATUS_UNREVIEWED {
		return "action_required"
	}

	if build.Status == models.BUILD_STATUS_APPROVED || build.Status == models.BUILD_STATUS_UNCHANGED || build.Status == models.BUILD_STATUS_ORPHANED {
		return "success"
	}

	return "neutral"
}

func (c *GithubAppClient) createCheckRun(ctx context.Context, project models.Project, build models.Build) error {

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

	detailsURL := os.Getenv("FRONTEND_URL") + "/projects/" + project.ID + "/builds/" + build.ID

	status := getStatus(build.Status)
	var conclusion string
	if status == "completed" {
		conclusion = getConclusion(build)
	}

	title := "Pixeleye -" + project.Name
	summary := "Current build status is " + build.Status
	text := "Some build details"

	startedAt := github.Timestamp{Time: build.CreatedAt}

	opts := github.CreateCheckRunOptions{
		Name:       "Pixeleye",
		HeadSHA:    build.Sha,
		DetailsURL: &detailsURL,
		ExternalID: &build.ID,
		Status:     &status,
		StartedAt:  &startedAt,
		Conclusion: &conclusion,
		Output: &github.CheckRunOutput{
			Title:   &title,
			Summary: &summary,
			Text:    &text,
		},
	}

	checkRun, _, err := c.Checks.CreateCheckRun(ctx, repo.Owner.GetLogin(), repo.GetName(), opts)
	if err != nil {
		return err
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	build.CheckRunID = strconv.FormatInt(checkRun.GetID(), 10)

	if err := db.UpdateBuildCheckRunID(ctx, build); err != nil {
		return err
	}

	return nil
}

func (c *GithubAppClient) updateCheckRun(ctx context.Context, project models.Project, build models.Build) error {

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
	var conclusion string
	if status == "completed" {
		conclusion = getConclusion(build)
	}

	title := "Pixeleye -" + project.Name
	summary := "Current build status is " + build.Status
	text := "Some build details"

	opts := github.UpdateCheckRunOptions{
		Status:     &status,
		Conclusion: &conclusion,
		ExternalID: &build.ID,
		Output: &github.CheckRunOutput{
			Title:   &title,
			Summary: &summary,
			Text:    &text,
		},
	}

	checkRunID, err := strconv.ParseInt(build.CheckRunID, 10, 64)
	if err != nil {
		return err
	}

	_, _, err = c.Checks.UpdateCheckRun(ctx, repo.Owner.GetLogin(), repo.GetName(), checkRunID, opts)
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

	if build.CheckRunID == "" {
		err := githubAppClient.createCheckRun(ctx, project, build)
		if err != nil {
			log.Error().Err(err).Msg("Failed to create check run")
		}
		return err
	}

	err = githubAppClient.updateCheckRun(ctx, project, build)
	if err != nil {
		log.Error().Err(err).Msg("Failed to update check run")
	}
	return err
}
