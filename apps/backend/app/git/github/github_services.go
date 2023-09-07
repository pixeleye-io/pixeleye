package git_github

import (
	"context"
	"database/sql"
	"fmt"
	"strconv"

	"github.com/google/go-github/github"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/platform/database"
	"github.com/rs/zerolog/log"
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

func (c *GithubClient) GetMembers(ctx context.Context, org string) ([]*github.User, error) {
	opts := &github.ListMembersOptions{
		PublicOnly: false,
		ListOptions: github.ListOptions{
			PerPage: 100,
		},
		Role: "all",
	}

	page := 1

	var members []*github.User

	for {

		opts.Page = page

		users, res, err := c.Organizations.ListMembers(ctx, org, opts)

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

func SyncTeamMembers(ctx context.Context, team models.Team) error {
	log.Debug().Msgf("Syncing team members for team %s", team.ID)
	if team.Type != models.TEAM_TYPE_GITHUB {
		return fmt.Errorf("team is not a github team")
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	installations, err := db.GetGitInstallations(ctx, team.ID)

	if err != nil {
		return err
	}

	if len(installations) == 0 {
		return fmt.Errorf("no github installations found for team %s", team.ID)
	} else if len(installations) > 1 {
		return fmt.Errorf("multiple installations found for team %s. Only 1 per non user team allowed", team.ID)
	}

	installation := installations[0]

	if installation.Type != models.GIT_TYPE_GITHUB {
		return fmt.Errorf("installation is not a github installation")
	}

	ghAppClient, err := NewGithubAppClient()
	if err != nil {
		return err
	}

	installInfo, err := ghAppClient.GetInstallationInfo(ctx, installation.InstallationID)
	if err != nil {
		return err
	}

	currentMembers, err := db.GetTeamUsers(ctx, team.ID)
	if err != nil {
		return err
	}

	ghInstallClient, err := NewGithubInstallClient(installation.InstallationID)
	if err != nil {
		return err
	}

	gitMembers, err := ghInstallClient.GetMembers(ctx, installInfo.GetAccount().GetLogin())
	if err != nil {
		return err
	}

	log.Debug().Msgf("Current Members: %+v", currentMembers)
	log.Debug().Msgf("Git Members: %+v", gitMembers)

	var membersToRemove []string
	// var existingMembers []string

	for _, currentMember := range currentMembers {
		found := false
		for _, gitMember := range gitMembers {
			if strconv.Itoa(int(gitMember.GetID())) == currentMember.GithubID {
				found = true

				// existingMembers = append(existingMembers, currentMember.ID)

				if currentMember.RoleSync {
					if gitMember.GetSiteAdmin() && currentMember.Role != models.TEAM_MEMBER_ROLE_ADMIN {
						if err := db.UpdateUserRoleOnTeam(ctx, currentMember.ID, models.TEAM_MEMBER_ROLE_ADMIN); err != nil {
							log.Error().Err(err).Msgf("Failed to update user role on team %s", team.ID)
							break
						}
					} else if !gitMember.GetSiteAdmin() && currentMember.Role != models.TEAM_MEMBER_ROLE_MEMBER {
						if err := db.UpdateUserRoleOnTeam(ctx, currentMember.ID, models.TEAM_MEMBER_ROLE_MEMBER); err != nil {
							log.Error().Err(err).Msgf("Failed to update user role on team %s", team.ID)
							break
						}
					}
				}
				break
			}
		}

		if !found {
			membersToRemove = append(membersToRemove, currentMember.ID)
		}
	}

	var membersToAdd []models.TeamMember

	for _, gitMember := range gitMembers {
		found := false
		for _, currentMember := range currentMembers {
			if strconv.Itoa(int(gitMember.GetID())) == currentMember.GithubID {
				found = true
				break
			}
		}

		if !found {

			user, err := db.GetUserByGithubID(ctx, strconv.Itoa(int(gitMember.GetID())))

			if err != nil {
				continue
			}

			if err == sql.ErrNoRows {
				continue
			}

			memberType := models.TEAM_MEMBER_TYPE_GIT
			role := models.TEAM_MEMBER_ROLE_MEMBER
			if gitMember.GetSiteAdmin() {
				role = models.TEAM_MEMBER_ROLE_ADMIN
			}
			membersToAdd = append(membersToAdd, models.TeamMember{
				UserID:   user.ID,
				Type:     &memberType,
				Role:     role,
				RoleSync: true,
				TeamID:   team.ID,
			})
		}
	}

	// TODO - add list of users to edit perms for

	if len(membersToRemove) > 0 {
		log.Debug().Msgf("Removing %d members from team %s", len(membersToRemove), team.ID)
		err = db.RemoveTeamMembers(ctx, team.ID, membersToRemove)
		if err != nil {
			return err
		}
	}

	if len(membersToAdd) > 0 {
		log.Debug().Msgf("Adding %d members to team %s", len(membersToAdd), team.ID)
		err = db.AddTeamMembers(ctx, membersToAdd)
		if err != nil {
			return err
		}
	}

	return nil
}
