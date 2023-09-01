package git_github

import (
	"context"
	"strconv"

	"github.com/google/go-github/github"
)

func (c *GithubClient) GetInstallationRepositories(ctx context.Context, page int) ([]*github.Repository, bool, error) {

	opts := &github.ListOptions{
		Page: page,
	}

	repos, res, err := c.Apps.ListRepos(ctx, opts)

	if err != nil {
		return nil, false, err
	}

	return repos, res.LastPage > page, err
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

func GetOrgMembers(ctx context.Context, client *github.Client, org string) ([]*github.User, error) {
	opts := &github.ListMembersOptions{
		PublicOnly: false,
		ListOptions: github.ListOptions{
			PerPage: 100,
		},
	}

	page := 1

	var members []*github.User

	for {

		opts.Page = page

		users, res, err := client.Organizations.ListMembers(ctx, org, opts)

		if err != nil {
			return nil, err
		}

		members = append(members, users...)

		if res.NextPage == 0 {
			break
		}

		page = res.NextPage

	}

	return members, nil
}
