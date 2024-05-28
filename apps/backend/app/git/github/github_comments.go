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

var mediaTypeCheckRunsPreview = "application/vnd.github.antiope-preview+json"

type CreateCheckRunOptions struct {
	Name        string                   `json:"name"`                   // The name of the check (e.g., "code-coverage"). (Required.)
	HeadSHA     string                   `json:"head_sha"`               // The SHA of the commit. (Required.)
	DetailsURL  *string                  `json:"details_url,omitempty"`  // The URL of the integrator's site that has the full details of the check. (Optional.)
	ExternalID  *string                  `json:"external_id,omitempty"`  // A reference for the run on the integrator's system. (Optional.)
	Status      *string                  `json:"status,omitempty"`       // The current status. Can be one of "queued", "in_progress", or "completed". Default: "queued". (Optional.)
	Conclusion  *string                  `json:"conclusion,omitempty"`   // Can be one of "success", "failure", "neutral", "cancelled", "skipped", "timed_out", or "action_required". (Optional. Required if you provide a status of "completed".)
	StartedAt   *github.Timestamp        `json:"started_at,omitempty"`   // The time that the check run began. (Optional.)
	CompletedAt *github.Timestamp        `json:"completed_at,omitempty"` // The time the check completed. (Optional. Required if you provide conclusion.)
	Output      *github.CheckRunOutput   `json:"output,omitempty"`       // Provide descriptive details about the run. (Optional)
	Actions     []*github.CheckRunAction `json:"actions,omitempty"`      // Possible further actions the integrator can perform, which a user may trigger. (Optional.)
	HtmlURL     *string                  `json:"html_url,omitempty"`     // URL of the check run. (Optional.)
}

func (s *GithubAppClient) createCheckRunRequest(ctx context.Context, owner, repo string, opts CreateCheckRunOptions) (*github.CheckRun, *github.Response, error) {
	u := fmt.Sprintf("repos/%v/%v/check-runs", owner, repo)
	req, err := s.Client.NewRequest("POST", u, opts)
	if err != nil {
		return nil, nil, err
	}

	req.Header.Set("Accept", mediaTypeCheckRunsPreview)

	checkRun := new(github.CheckRun)
	resp, err := s.Client.Do(ctx, req, checkRun)
	if err != nil {
		return nil, resp, err
	}

	return checkRun, resp, nil
}

type UpdateCheckRunOptions struct {
	Name        string                   `json:"name"`                   // The name of the check (e.g., "code-coverage"). (Required.)
	DetailsURL  *string                  `json:"details_url,omitempty"`  // The URL of the integrator's site that has the full details of the check. (Optional.)
	ExternalID  *string                  `json:"external_id,omitempty"`  // A reference for the run on the integrator's system. (Optional.)
	Status      *string                  `json:"status,omitempty"`       // The current status. Can be one of "queued", "in_progress", or "completed". Default: "queued". (Optional.)
	Conclusion  *string                  `json:"conclusion,omitempty"`   // Can be one of "success", "failure", "neutral", "cancelled", "skipped", "timed_out", or "action_required". (Optional. Required if you provide a status of "completed".)
	CompletedAt *github.Timestamp        `json:"completed_at,omitempty"` // The time the check completed. (Optional. Required if you provide conclusion.)
	Output      *github.CheckRunOutput   `json:"output,omitempty"`       // Provide descriptive details about the run. (Optional)
	Actions     []*github.CheckRunAction `json:"actions,omitempty"`      // Possible further actions the integrator can perform, which a user may trigger. (Optional.)
	HtmlURL     *string                  `json:"html_url,omitempty"`     // URL of the check run. (Optional.)
}

func (s *GithubAppClient) updateCheckRunInternal(ctx context.Context, owner, repo string, checkRunID int64, opts UpdateCheckRunOptions) (*github.CheckRun, *github.Response, error) {
	u := fmt.Sprintf("repos/%v/%v/check-runs/%v", owner, repo, checkRunID)
	req, err := s.Client.NewRequest("PATCH", u, opts)
	if err != nil {
		return nil, nil, err
	}

	req.Header.Set("Accept", mediaTypeCheckRunsPreview)

	checkRun := new(github.CheckRun)
	resp, err := s.Client.Do(ctx, req, checkRun)
	if err != nil {
		return nil, resp, err
	}

	return checkRun, resp, nil
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

	detailsURL := getDetailsURL(build)

	status := getStatus(build.Status)

	opts := CreateCheckRunOptions{
		Name:       "Pixeleye — " + project.Name,
		HeadSHA:    build.Sha,
		DetailsURL: &detailsURL,
		ExternalID: &build.ID,
		Status:     &status,
		HtmlURL:    &detailsURL,
	}

	if status == "completed" {
		conclusion := getConclusion(build)
		opts.Conclusion = &conclusion
	}

	checkRun, _, err := c.createCheckRunRequest(ctx, repo.Owner.GetLogin(), repo.GetName(), opts)
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

func getDetailsURL(build models.Build) string {
	return os.Getenv("FRONTEND_URL") + "/builds/" + build.ID
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

	detailsURL := getDetailsURL(build)

	opts := UpdateCheckRunOptions{
		Status:     &status,
		ExternalID: &build.ID,
		Name:       "Pixeleye — " + project.Name,
		DetailsURL: &detailsURL,
		HtmlURL:    &detailsURL,
	}

	if status == "completed" {
		conclusion := getConclusion(build)
		opts.Conclusion = &conclusion
	}

	checkRunID, err := strconv.ParseInt(build.CheckRunID, 10, 64)
	if err != nil {
		return err
	}

	_, _, err = c.updateCheckRunInternal(ctx, repo.Owner.GetLogin(), repo.GetName(), checkRunID, opts)
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
