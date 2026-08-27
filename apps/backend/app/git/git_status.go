package git

import (
	"context"

	git_bitbucket "github.com/pixeleye-io/pixeleye/app/git/bitbucket"
	git_bitbucketserver "github.com/pixeleye-io/pixeleye/app/git/bitbucketserver"
	git_github "github.com/pixeleye-io/pixeleye/app/git/github"
	"github.com/pixeleye-io/pixeleye/app/models"
)

func SyncBuildStatusWithVCS(ctx context.Context, project models.Project, build models.Build) error {

	switch project.Source {
	case models.GIT_TYPE_GITHUB:
		return git_github.SyncBuildStatusWithGithub(ctx, project, build)
	case models.SOURCE_BITBUCKET:
		return git_bitbucket.SyncBuildStatusWithBitbucket(ctx, project, build)
	case models.SOURCE_BITBUCKET_SERVER:
		return git_bitbucketserver.SyncBuildStatusWithBitbucketServer(ctx, project, build)
	default:
		return nil
	}
}
