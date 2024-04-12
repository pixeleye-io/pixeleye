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

func (c *GithubAppClient) createCheckRun(ctx context.Context, team models.Team, project models.Project, build models.Build, snapshots []models.Snapshot) error {

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

	startedAt := github.Timestamp{Time: build.CreatedAt}

	summary := "Build status: " + build.Status
	title := "Pixeleye — " + project.Name

	content := buildContent(team, project, build, snapshots)

	opts := github.CreateCheckRunOptions{
		Name:       title,
		HeadSHA:    build.Sha,
		DetailsURL: &detailsURL,
		ExternalID: &build.ID,
		Status:     &status,
		StartedAt:  &startedAt,
		Output: &github.CheckRunOutput{
			Title:   &summary,
			Summary: &summary,
			Text:    &content,
		},
	}

	if status == "completed" {
		conclusion := getConclusion(build)

		opts.Conclusion = &conclusion
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

func buildContent(team models.Team, project models.Project, build models.Build, snapshots []models.Snapshot) string {
	content := fmt.Sprintf("# %s/%s — %s %s\n\n", team.Name, project.Name, getStatusEmoji(build.Status), getBuildStatusTitle(build.Status))
	content += fmt.Sprintf("## Statuses of %d Snapshots\n", len(snapshots))

	queued := 0
	processing := 0
	failed := 0
	approved := 0
	rejected := 0
	unreviewed := 0
	unchanged := 0
	orphaned := 0
	missing_baseline := 0

	for _, snapshot := range snapshots {
		switch snapshot.Status {
		case models.SNAPSHOT_STATUS_QUEUED:
			queued++
		case models.SNAPSHOT_STATUS_PROCESSING:
			processing++
		case models.SNAPSHOT_STATUS_FAILED:
			failed++
		case models.SNAPSHOT_STATUS_APPROVED:
			approved++
		case models.SNAPSHOT_STATUS_REJECTED:
			rejected++
		case models.SNAPSHOT_STATUS_UNREVIEWED:
			unreviewed++
		case models.SNAPSHOT_STATUS_UNCHANGED:
			unchanged++
		case models.SNAPSHOT_STATUS_ORPHANED:
			orphaned++
		case models.SNAPSHOT_STATUS_MISSING_BASELINE:
			missing_baseline++
		}
	}

	headers := ""
	columns := ""
	counts := ""

	if queued > 0 {
		headers += "| Queued |"
		columns += "|:------:|"
		counts += fmt.Sprintf("| %d |", queued)
	}

	if processing > 0 {
		headers += "| Processing |"
		columns += "|:----------:|"
		counts += fmt.Sprintf("| %d |", processing)
	}

	if failed > 0 {
		headers += "| Failed |"
		columns += "|:------:|"
		counts += fmt.Sprintf("| %d |", failed)
	}

	if approved > 0 {
		headers += "| Approved |"
		columns += "|:--------:|"
		counts += fmt.Sprintf("| %d |", approved)
	}

	if rejected > 0 {
		headers += "| Rejected |"
		columns += "|:--------:|"
		counts += fmt.Sprintf("| %d |", rejected)
	}

	if unreviewed > 0 {
		headers += "| Unreviewed |"
		columns += "|:----------:|"
		counts += fmt.Sprintf("| %d |", unreviewed)
	}

	if unchanged > 0 {
		headers += "| Unchanged |"
		columns += "|:----------:|"
		counts += fmt.Sprintf("| %d |", unchanged)
	}

	if orphaned > 0 {
		headers += "| Orphaned |"
		columns += "|:--------:|"
		counts += fmt.Sprintf("| %d |", orphaned)
	}

	if missing_baseline > 0 {
		headers += "| Missing Baseline |"
		columns += "|:----------------:|"
		counts += fmt.Sprintf("| %d |", missing_baseline)
	}

	if headers != "" {
		content += headers + "\n"
		content += columns + "\n"
		content += counts + "\n"
	}

	content += fmt.Sprintf("\n> View the full [build](%s) on Pixeleye\n", getDetailsURL(build))

	return content
}

func (c *GithubAppClient) updateCheckRun(ctx context.Context, team models.Team, project models.Project, build models.Build, snapshots []models.Snapshot) error {

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

	title := "Pixeleye — " + project.Name
	summary := "Build status: " + build.Status

	content := buildContent(team, project, build, snapshots)

	opts := github.UpdateCheckRunOptions{
		Status:     &status,
		ExternalID: &build.ID,
		Name:       title,
		DetailsURL: &detailsURL,
		Output: &github.CheckRunOutput{
			Title:   &summary,
			Summary: &summary,
			Text:    &content,
		},
	}

	if status == "completed" {
		conclusion := getConclusion(build)
		opts.Conclusion = &conclusion
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

	team, err := db.GetTeamByID(ctx, project.TeamID)
	if err != nil {
		return err
	}

	snapshots, err := db.GetSnapshotsByBuild(ctx, build.ID)

	if build.CheckRunID == "" {
		err := githubAppClient.createCheckRun(ctx, team, project, build, snapshots)
		if err != nil {
			log.Error().Err(err).Msg("Failed to create check run")
		}
		return err
	}

	err = githubAppClient.updateCheckRun(ctx, team, project, build, snapshots)
	if err != nil {
		log.Error().Err(err).Msg("Failed to update check run")
	}
	return err
}
