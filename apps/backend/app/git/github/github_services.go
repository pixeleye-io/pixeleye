package git_github

import (
	"context"
	"strconv"

	"github.com/google/go-github/github"
)

func (c *GithubClient) GetInstallationRepositories(ctx context.Context, page int) ([]*github.Repository, error) {

	opts := &github.ListOptions{
		Page: page,
	}

	repos, _, err := c.Apps.ListRepos(ctx, opts)
	return repos, err
}

func (c *GithubClient) GetInstallationInfo(ctx context.Context, installationID string) (*github.Installation, error) {

	id, err := strconv.Atoi(installationID)

	if err != nil {
		return nil, err
	}

	install, _, err := c.Apps.GetInstallation(ctx, int64(id))
	return install, err
}

func IsUserInstallation(app github.Installation) bool {
	return app.Account.Type != nil && *app.Account.Type == "User"
}

func IsOrgInstallation(app github.Installation) bool {
	return app.Account.Type != nil && *app.Account.Type == "Organization"
}
