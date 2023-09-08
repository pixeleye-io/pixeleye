package git_github

import (
	"context"
	"fmt"
	"strconv"

	"github.com/google/go-github/github"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/app/queries"
	Team_queries "github.com/pixeleye-io/pixeleye/app/queries/team"
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

func ListCollaborators(ctx context.Context, client *github.Client, org string, repo string) ([]*github.User, error) {
	opts := &github.ListCollaboratorsOptions{
		ListOptions: github.ListOptions{
			PerPage: 100,
		},
		Affiliation: "all",
	}

	page := 1

	var collaborators []*github.User

	for {

		opts.Page = page

		collaboratorsList, res, err := client.Repositories.ListCollaborators(ctx, org, repo, opts)

		if err != nil {
			return nil, err
		}

		collaborators = append(collaborators, collaboratorsList...)

		if res.NextPage == 0 {
			break
		}

		page = res.NextPage

	}

	return collaborators, nil
}

func SyncGithubProjectMembers(ctx context.Context, db *database.Queries, team models.Team, teamUsers []Team_queries.UserOnTeam, project models.Project) error {

	installation, err := db.GetGitInstallation(ctx, team.ID, models.TEAM_TYPE_GITHUB, false)
	if err != nil {
		return err
	}

	ghClient, err := NewGithubInstallClient(installation.InstallationID)
	if err != nil {
		return err
	}

	repoID, err := strconv.ParseInt(project.SourceID, 10, 64)
	if err != nil {
		return err
	}

	repo, _, err := ghClient.Repositories.GetByID(ctx, repoID)
	if err != nil {
		return err
	}

	collaborators, err := ListCollaborators(ctx, ghClient.Client, repo.GetOwner().GetLogin(), repo.GetName())
	if err != nil {
		return err
	}

	projectMembers, err := db.GetProjectUsers(ctx, project.ID)
	if err != nil {
		return err
	}

	log.Debug().Msgf("Collaborators: %+v", collaborators)

	var membersToRemove []string

	for _, projectMember := range projectMembers {

		// We don't want to remove users added manually
		if !projectMember.RoleSync {
			continue
		}

		found := false
		for _, collaborator := range collaborators {
			if projectMember.GithubID == strconv.Itoa(int(collaborator.GetID())) {
				found = true
				break
			}
		}

		if !found && projectMember.RoleSync {
			membersToRemove = append(membersToRemove, projectMember.ID)
		}
	}

	var viewerCollaborators []string
	var reviewerCollaborators []string
	var adminCollaborators []string

	for _, user := range teamUsers {
		found := false
		githubUser := &github.User{}
		for _, collaborator := range collaborators {
			if user.GithubID == strconv.Itoa(int(collaborator.GetID())) {
				found = true
				githubUser = collaborator
				break
			}
		}

		if !found {
			continue
		}

		perms := githubUser.GetPermissions()
		if perms == nil {
			continue
		}

		userOnProject := queries.UserOnProject{}

		for _, projectMember := range projectMembers {
			if projectMember.GithubID == user.GithubID {
				userOnProject = projectMember
				break
			}
		}

		if userOnProject.User != nil && !userOnProject.RoleSync {
			// User is already on team and their role is not synced
			continue
		}

		log.Debug().Msgf("User %s perms: %+v", githubUser.GetLogin(), perms)

		if perms["admin"] {
			adminCollaborators = append(adminCollaborators, user.ID)
		} else if perms["push"] {
			reviewerCollaborators = append(reviewerCollaborators, user.ID)
		} else if perms["pull"] {
			viewerCollaborators = append(viewerCollaborators, user.ID)
		}
	}

	if len(membersToRemove) > 0 {
		log.Debug().Msgf("Removing %d collaborators from project %s", len(membersToRemove), project.ID)
		err = db.RemoveUsersFromProject(ctx, project.ID, membersToRemove)
		if err != nil {
			log.Error().Err(err).Msgf("Failed to remove users from project %s", project.ID)
			return err
		}
	}

	if len(viewerCollaborators) > 0 {
		log.Debug().Msgf("Adding %d viewers to project %s", len(viewerCollaborators), project.ID)
		err = db.AddUsersToProject(ctx, project.ID, viewerCollaborators, models.PROJECT_MEMBER_ROLE_VIEWER, true)
		if err != nil {
			log.Error().Err(err).Msgf("Failed to add users to project %s", project.ID)
			return err
		}
	}

	if len(reviewerCollaborators) > 0 {
		log.Debug().Msgf("Adding %d reviewers to project %s", len(reviewerCollaborators), project.ID)
		err = db.AddUsersToProject(ctx, project.ID, reviewerCollaborators, models.PROJECT_MEMBER_ROLE_REVIEWER, true)
		if err != nil {
			log.Error().Err(err).Msgf("Failed to add users to project %s", project.ID)
			return err
		}
	}

	if len(adminCollaborators) > 0 {
		log.Debug().Msgf("Adding %d admins to project %s", len(adminCollaborators), project.ID)
		err = db.AddUsersToProject(ctx, project.ID, adminCollaborators, models.PROJECT_MEMBER_ROLE_ADMIN, true)
		if err != nil {
			log.Error().Err(err).Msgf("Failed to add users to project %s", project.ID)
			return err
		}
	}

	log.Debug().Msgf("Synced project members for project %s", project.ID)

	return nil
}

func SyncGithubTeamMembers(ctx context.Context, team models.Team) error {
	log.Debug().Msgf("Syncing team members for team %s", team.ID)
	if team.Type != models.TEAM_TYPE_GITHUB {
		return fmt.Errorf("team is not a github team")
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	installation, err := db.GetGitInstallation(ctx, team.ID, models.TEAM_TYPE_GITHUB, false)
	if err != nil {
		return err
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
		tx, err := Team_queries.NewTeamTx(db.TeamQueries.DB, ctx)
		if err != nil {
			return err
		}
		if err := tx.RemoveTeamMembers(ctx, team.ID, membersToRemove); err != nil {
			return err
		}
		if err := tx.Commit(); err != nil {
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
