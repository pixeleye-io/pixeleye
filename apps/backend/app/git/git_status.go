package git

import (
	"context"

	git_github "github.com/pixeleye-io/pixeleye/app/git/github"
	"github.com/pixeleye-io/pixeleye/app/models"
)

func SyncBuildStatusWithVCS(ctx context.Context, project models.Project, build models.Build) error {

	switch project.Source {
	case models.GIT_TYPE_GITHUB:
		return git_github.SyncBuildStatusWithGithub(ctx, project, build)
	default:
		return nil
	}
}
