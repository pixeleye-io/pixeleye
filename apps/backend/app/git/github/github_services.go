package git_github

import (
	"context"
	"database/sql"
	"fmt"
	"strconv"
	"strings"

	"github.com/google/go-github/v59/github"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/app/queries"
	github_queries "github.com/pixeleye-io/pixeleye/app/queries/github"
	team_queries "github.com/pixeleye-io/pixeleye/app/queries/team"
	"github.com/pixeleye-io/pixeleye/platform/database"
	"github.com/rs/zerolog/log"
)

func removeInstallationFromDB(ctx context.Context, installationID string) error {
	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	if err := db.TeamQueries.DeleteTeamInstallation(ctx, installationID); err != nil {
		return err
	}

	return fmt.Errorf("installation was uninstalled from github")
}

func (c *GithubAppClient) GetInstallationRepositories(ctx context.Context, page int) (*github.ListRepositories, bool, error) {

	opts := &github.ListOptions{
		Page: page,
	}

	repos, res, err := c.Apps.ListRepos(ctx, opts)

	if err != nil {

		// TODO - this is a hack, we should be able to check the status code of the response
		if strings.Contains(err.Error(), "\"403") {
			return nil, false, fmt.Errorf("installation was suspended from github")
		}

		if strings.Contains(err.Error(), "\"404") {
			return nil, false, removeInstallationFromDB(ctx, c.InstallationID)
		}

		return nil, false, err
	}

	return repos, res.LastPage > page, err
}

func (c *GithubAppClient) GetInstallationInfo(ctx context.Context, installationID string) (*github.Installation, error) {

	id, err := strconv.Atoi(installationID)

	if err != nil {
		return nil, err
	}

	install, res, err := c.Apps.GetInstallation(ctx, int64(id))
	if err != nil {

		// TODO - this is a hack, we should be able to check the status code of the response
		if strings.Contains(err.Error(), "\"403") {
			return nil, fmt.Errorf("installation was suspended from github")
		}

		if res != nil && res.StatusCode == 404 {
			return nil, removeInstallationFromDB(ctx, installationID)
		}

		return nil, err
	}

	return install, nil
}

func IsUserInstallation(app github.Installation) bool {
	return app.Account.Type != nil && *app.Account.Type == "User"
}

func IsOrgInstallation(app github.Installation) bool {
	return app.Account.Type != nil && *app.Account.Type == "Organization"
}

func (c *GithubAppClient) GetMembers(ctx context.Context, org string) (admins []*github.User, members []*github.User, err error) {
	opts := &github.ListMembersOptions{
		PublicOnly: false,
		ListOptions: github.ListOptions{
			PerPage: 100,
		},
		Role: "admin",
	}

	page := 1

	for {

		opts.Page = page

		users, res, err := c.Organizations.ListMembers(ctx, org, opts)

		if err != nil {

			if res != nil && res.StatusCode == 404 {
				return nil, nil, removeInstallationFromDB(ctx, c.InstallationID)
			}

			return nil, nil, err
		}

		admins = append(admins, users...)

		if res.NextPage == 0 {
			break
		}

		page = res.NextPage

	}

	page = 1
	opts.Role = "member"

	for {

		opts.Page = page

		users, res, err := c.Organizations.ListMembers(ctx, org, opts)

		if res != nil && res.StatusCode == 404 {
			return nil, nil, removeInstallationFromDB(ctx, c.InstallationID)
		}

		if err != nil {
			return nil, nil, err
		}

		members = append(members, users...)

		if res.NextPage == 0 {
			break
		}

		page = res.NextPage

	}

	return admins, members, nil
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

func findMembersToRemove(currentMembers []queries.UserOnProject, gitMembers []*github.User) []string {
	var membersToRemove []string

	for _, member := range currentMembers {

		// We don't want to remove users added manually
		if !member.RoleSync {
			continue
		}

		found := false
		for _, collaborator := range gitMembers {
			if member.GithubID == strconv.Itoa(int(collaborator.GetID())) {
				found = true
				break
			}
		}

		if !found && member.RoleSync {
			membersToRemove = append(membersToRemove, member.ID)
		}
	}

	return membersToRemove
}

func findProjectMembersToUpdate(teamUsers []team_queries.UserOnTeam, currentMembers []queries.UserOnProject, gitMembers []*github.User) (viewerCollaborators []string, reviewerCollaborators []string, adminCollaborators []string) {

	for _, user := range teamUsers {

		// User should be on the github team

		found := false
		githubUser := &github.User{}
		for _, collaborator := range gitMembers {
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

		for _, projectMember := range currentMembers {
			if projectMember.GithubID == user.GithubID {
				userOnProject = projectMember
				break
			}
		}

		if userOnProject.User != nil && !userOnProject.RoleSync {
			// User is already on team and their role is not synced
			continue
		}

		if perms["admin"] {
			adminCollaborators = append(adminCollaborators, user.ID)
		} else if perms["push"] {
			reviewerCollaborators = append(reviewerCollaborators, user.ID)
		} else if perms["pull"] {
			viewerCollaborators = append(viewerCollaborators, user.ID)
		}
	}

	return viewerCollaborators, reviewerCollaborators, adminCollaborators
}

func SyncGithubProjectMembers(ctx context.Context, team models.Team, project models.Project) error {

	if (team.Type != models.TEAM_TYPE_GITHUB && team.Type != models.TEAM_TYPE_USER) && project.Source != models.GIT_TYPE_GITHUB {
		return fmt.Errorf("project %s is not a github project", project.ID)
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	teamUsers, err := db.GetUsersOnTeam(ctx, team.ID)
	if err != nil {
		return err
	}

	installation, err := db.GetGitInstallation(ctx, team.ID, models.TEAM_TYPE_GITHUB)
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

	projectMembers, err := db.GetProjectUsers(ctx, project)
	if err != nil {
		return err
	}

	log.Debug().Msgf("Collaborators: %+v", collaborators)

	membersToRemove := findMembersToRemove(projectMembers, collaborators)

	viewerCollaborators, reviewerCollaborators, adminCollaborators := findProjectMembersToUpdate(teamUsers, projectMembers, collaborators)

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
		err = db.AddUsersToProject(ctx, project.ID, viewerCollaborators, models.PROJECT_MEMBER_ROLE_VIEWER, true, "git")
		if err != nil {
			log.Error().Err(err).Msgf("Failed to add users to project %s", project.ID)
			return err
		}
	}

	if len(reviewerCollaborators) > 0 {
		log.Debug().Msgf("Adding %d reviewers to project %s", len(reviewerCollaborators), project.ID)
		err = db.AddUsersToProject(ctx, project.ID, reviewerCollaborators, models.PROJECT_MEMBER_ROLE_REVIEWER, true, "git")
		if err != nil {
			log.Error().Err(err).Msgf("Failed to add users to project %s", project.ID)
			return err
		}
	}

	if len(adminCollaborators) > 0 {
		log.Debug().Msgf("Adding %d admins to project %s", len(adminCollaborators), project.ID)
		err = db.AddUsersToProject(ctx, project.ID, adminCollaborators, models.PROJECT_MEMBER_ROLE_ADMIN, true, "git")
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
		return nil
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	installation, err := db.GetGitInstallation(ctx, team.ID, models.TEAM_TYPE_GITHUB)
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

	currentMembers, err := db.GetUsersOnTeam(ctx, team.ID)
	if err != nil {
		return err
	}

	ghInstallClient, err := NewGithubInstallClient(installation.InstallationID)
	if err != nil {
		return err
	}

	gitAdmins, gitMembers, err := ghInstallClient.GetMembers(ctx, installInfo.GetAccount().GetLogin())
	if err != nil {
		return err
	}

	log.Debug().Msgf("Current Members: %+v", currentMembers)
	log.Debug().Msgf("Git Members: %+v", gitMembers)
	log.Debug().Msgf("Git Admins: %+v", gitAdmins)

	var membersToRemove []string

	for _, currentMember := range currentMembers {
		found := false

		// Update the role of the user if it has changed and their role is synced
		for i, gitMember := range append(gitAdmins, gitMembers...) {
			log.Debug().Msgf("Comparing %s with %s", currentMember.GithubID, strconv.Itoa(int(gitMember.GetID())))
			if strconv.Itoa(int(gitMember.GetID())) == currentMember.GithubID {
				found = true

				admin := len(gitAdmins) > i

				log.Debug().Msgf("RoleSync: %t", currentMember.RoleSync)

				if currentMember.Type == models.TEAM_MEMBER_TYPE_INVITED {
					// We're upgrading the user to a vcs account but they will keep the same role and it won't be synced
					if err := db.UpdateUserTypeOnTeam(ctx, team.ID, currentMember.ID, models.TEAM_MEMBER_TYPE_GIT, false); err != nil {
						log.Error().Err(err).Msgf("Failed to update user type on team %s", team.ID)
						break
					}
				} else if currentMember.RoleSync {
					if admin && currentMember.Role != models.TEAM_MEMBER_ROLE_ADMIN {
						if err := db.UpdateUserRoleOnTeam(ctx, team.ID, currentMember.ID, models.TEAM_MEMBER_ROLE_ADMIN, true); err != nil {
							log.Error().Err(err).Msgf("Failed to update user role on team %s", team.ID)
							break
						}
					} else if !admin && currentMember.Role != models.TEAM_MEMBER_ROLE_MEMBER {
						if err := db.UpdateUserRoleOnTeam(ctx, team.ID, currentMember.ID, models.TEAM_MEMBER_ROLE_MEMBER, true); err != nil {
							log.Error().Err(err).Msgf("Failed to update user role on team %s", team.ID)
							break
						}
					}
				}
				break
			}
		}

		log.Debug().Msgf("Found: %t, RoleSync: %t, CurrentMember: %+v", found, currentMember.RoleSync, currentMember)

		// TODO - we shouldn't allow admins to transfer ownership to invited users

		// Don't remove invited users
		if !found && currentMember.Type == models.TEAM_MEMBER_TYPE_GIT {
			if isInvited, err := db.IsUserInvitedToProjects(ctx, team.ID, currentMember.ID); err != nil {
				log.Error().Err(err).Msgf("Failed to check if user is invited to projects on team %s", team.ID)
				continue
			} else if isInvited || currentMember.Role == models.TEAM_MEMBER_ROLE_OWNER {
				// if user is an owner we should move the user to invited since they are no longer part of the github team
				// later down we'll attempt to transfer ownership to the first admin, this avoids situations where the owner is a bad actor with complete control over the team

				tx, err := team_queries.NewTeamTx(db.TeamQueries.DB, ctx)
				if err != nil {
					log.Error().Err(err).Msgf("Failed to create team tx")
					continue
				}

				pTx := queries.ProjectQueriesTx{
					Tx: tx.Tx,
				}

				// Remove user from all projects they're not invited to and set their team type to invited
				if err := pTx.RemoveUserFromAllGitProjects(ctx, team.ID, currentMember.ID); err != nil {
					log.Error().Err(err).Msgf("Failed to remove user from all git projects on team %s", team.ID)
					if err := tx.Rollback(); err != nil {
						log.Error().Err(err).Msgf("Failed to rollback team tx")
					}
				}
				if err := tx.UpdateUserTypeOnTeam(ctx, team.ID, currentMember.ID, models.TEAM_MEMBER_TYPE_INVITED, false); err != nil {
					log.Error().Err(err).Msgf("Failed to update user type on team %s", team.ID)
					if err := tx.Rollback(); err != nil {
						log.Error().Err(err).Msgf("Failed to rollback team tx")
					}
				}

				if err := tx.Commit(); err != nil {
					log.Error().Err(err).Msgf("Failed to commit team tx")
				}

			} else {
				// User isn't invited to any projects so we can remove them from the team
				membersToRemove = append(membersToRemove, currentMember.ID)
			}
		}
	}

	var membersToAdd []models.TeamMember

	for i, gitMember := range append(gitAdmins, gitMembers...) {
		found := false
		admin := len(gitAdmins) > i

		for _, currentMember := range currentMembers {
			if strconv.Itoa(int(gitMember.GetID())) == currentMember.GithubID {
				found = true
				break
			}
		}

		if !found {

			user, err := db.GetUserByProviderID(ctx, strconv.Itoa(int(gitMember.GetID())), models.ACCOUNT_PROVIDER_GITHUB)
			if err != nil && err != sql.ErrNoRows {
				log.Err(err).Msgf("Failed to get user by provider id %s", strconv.Itoa(int(gitMember.GetID())))
				continue
			} else if err == sql.ErrNoRows {
				log.Debug().Msgf("User with provider id %s not found", strconv.Itoa(int(gitMember.GetID())))
				continue
			}

			log.Debug().Msgf("User with provider id %s found", strconv.Itoa(int(gitMember.GetID())))

			role := models.TEAM_MEMBER_ROLE_MEMBER
			if admin {
				role = models.TEAM_MEMBER_ROLE_ADMIN
			}
			membersToAdd = append(membersToAdd, models.TeamMember{
				UserID:   user.ID,
				Type:     models.TEAM_MEMBER_TYPE_GIT,
				Role:     role,
				RoleSync: true,
				TeamID:   team.ID,
			})
		}
	}

	if len(membersToRemove) > 0 {
		log.Debug().Msgf("Removing %d members from team %s", len(membersToRemove), team.ID)
		log.Debug().Msgf("Members to remove: %+v", membersToRemove)
		if err := db.RemoveTeamMembers(ctx, team.ID, membersToRemove); err != nil {
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

	// We can transfer ownership to the first admin if the owner is not a git member
	if err := tryMakeOwnerGitMember(ctx, team.ID); err != nil {
		return err
	}

	return nil
}

// tryMakeOwnerGitMember is a function that attempts to make the owner of a team a git member.
// It takes a context and a teamID as input parameters.
// It returns an error if there is any issue with the database connection or the database operations.
func tryMakeOwnerGitMember(ctx context.Context, teamID string) error {

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	teamMembers, err := db.GetUsersOnTeam(ctx, teamID)
	if err != nil && err != sql.ErrNoRows {
		return err
	}

	firstAdmin := team_queries.UserOnTeam{}
	owner := team_queries.UserOnTeam{}

	for _, member := range teamMembers {
		if member.Role == models.TEAM_MEMBER_ROLE_ADMIN {
			firstAdmin = member
		} else if member.Role == models.TEAM_MEMBER_ROLE_OWNER {
			owner = member
		}

		if (firstAdmin.User != nil && owner.User != nil) || (owner.User != nil && owner.Type == models.TEAM_MEMBER_TYPE_GIT) {
			// We don't have an admin to make the owner or the owner is already a git member
			break
		}
	}

	if firstAdmin.User == nil || owner.Type == models.TEAM_MEMBER_TYPE_GIT {
		// We either don't have an admin to make the owner or the owner is already a git member
		return nil
	}

	// We have an admin to make the owner and the owner is not a git member so we can make them a git member
	tx, err := team_queries.NewTeamTx(db.TeamQueries.DB, ctx)
	if err != nil {
		return err
	}

	if err := tx.UpdateUserRoleOnTeam(ctx, teamID, owner.ID, models.TEAM_MEMBER_ROLE_ADMIN, false); err != nil {
		if err := tx.Rollback(); err != nil {
			log.Error().Err(err).Msgf("Failed to rollback team tx")
		}
		return err
	}

	if err := tx.UpdateUserRoleOnTeam(ctx, teamID, firstAdmin.ID, models.TEAM_MEMBER_ROLE_OWNER, false); err != nil {
		if err := tx.Rollback(); err != nil {
			log.Error().Err(err).Msgf("Failed to rollback team tx")
		}
		return err
	}

	return tx.Commit()
}

func LinkPersonalGithubTeam(ctx context.Context, user models.User, installationID string) (models.Team, models.GitInstallation, error) {
	db, err := database.OpenDBConnection()
	if err != nil {
		return models.Team{}, models.GitInstallation{}, err
	}

	tx, err := github_queries.NewGithubTx(db.GithubQueries.DB, ctx)
	if err != nil {
		return models.Team{}, models.GitInstallation{}, err
	}

	personalTeam, err := db.GetUsersPersonalTeam(ctx, user)
	if err != nil {
		return models.Team{}, models.GitInstallation{}, err
	}

	log.Debug().Msgf("Personal Team: %+v", personalTeam)

	installation, err := tx.CreateGithubAppInstallation(ctx, installationID, personalTeam.ID)
	if err != nil {
		if err := tx.Rollback(); err != nil {
			log.Error().Err(err).Msgf("Failed to rollback github tx")
		}
		return models.Team{}, models.GitInstallation{}, err
	}

	return personalTeam, installation, tx.Commit()
}

func LinkOrgGithubTeam(ctx context.Context, user models.User, app *github.Installation, installationID string) (models.Team, models.GitInstallation, error) {

	db, err := database.OpenDBConnection()

	if err != nil {
		return models.Team{}, models.GitInstallation{}, err
	}

	tx, err := github_queries.NewGithubTx(db.GithubQueries.DB, ctx)

	if err != nil {
		return models.Team{}, models.GitInstallation{}, err
	}

	completed := false
	defer func(completed *bool) {
		if !*completed {
			if err := tx.Rollback(); err != nil {
				log.Error().Err(err).Msgf("Failed to rollback github tx")
			}
		}
	}(&completed)

	team, err := db.GetTeamFromExternalID(ctx, strconv.Itoa(int(*app.Account.ID)))

	if err == sql.ErrNoRows {
		// Team does not exist, we create it
		ttx := team_queries.TeamQueriesTx{
			Tx: tx.Tx,
		}

		log.Debug().Msgf("App: %+v", app)

		team = models.Team{
			Type:       models.TEAM_TYPE_GITHUB,
			Name:       app.Account.GetLogin(),
			URL:        app.Account.GetOrganizationsURL(),
			AvatarURL:  app.Account.GetAvatarURL(),
			Role:       models.TEAM_MEMBER_ROLE_OWNER,
			ExternalID: strconv.Itoa(int(app.Account.GetID())),
		}

		err = ttx.CreateTeam(ctx, &team, user)
		if err != nil {
			return models.Team{}, models.GitInstallation{}, err
		}

	} else if err != nil {
		return models.Team{}, models.GitInstallation{}, err
	}

	existingInstallation, err := tx.GetGithubAppInstallationByTeamIDForUpdate(ctx, team.ID)
	if err != nil && err != sql.ErrNoRows {
		return models.Team{}, models.GitInstallation{}, err
	}

	if err != sql.ErrNoRows {
		// Installation already exists, we can update it

		existingInstallation.InstallationID = installationID

		err := tx.UpdateGithubAppInstallation(ctx, &existingInstallation)
		if err != nil {
			return models.Team{}, models.GitInstallation{}, err
		}

		if err := tx.Commit(); err != nil {
			return models.Team{}, models.GitInstallation{}, err
		}

		return team, existingInstallation, nil
	}

	log.Debug().Msgf("Team: %+v", team)

	installation, err := tx.CreateGithubAppInstallation(ctx, installationID, team.ID)
	if err != nil {
		return team, installation, err
	}

	log.Debug().Msgf("Created Github App Installation: %+v", installation)

	if err := tx.Commit(); err != nil {
		return team, installation, err
	}

	completed = true

	return team, installation, nil
}

func SyncNewGithubUserTeams(ctx context.Context, userID string, currentTeams []models.Team) error {

	userClient, err := NewGithubUserClient(ctx, userID)
	if err != nil {
		return err
	}

	githubUser, _, err := userClient.Users.Get(ctx, "")
	if err != nil {
		return err
	}

	opts := &github.ListOptions{
		PerPage: 100,
	}

	installations := []*github.Installation{}

	for {
		installationsPage, res, err := userClient.Apps.ListUserInstallations(ctx, opts)
		if err != nil {
			return err
		}

		installations = append(installations, installationsPage...)

		if res.NextPage == 0 {
			break
		}

		opts.Page = res.NextPage
	}

	log.Debug().Msgf("Found %d installations for user %s", len(installations), userID)

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	installationIDs := []string{}
	for _, installation := range installations {
		installationIDs = append(installationIDs, strconv.Itoa(int(installation.GetID())))
	}

	log.Debug().Msgf("Installation IDs: %+v", installationIDs)

	gitInstallations, err := db.GetGitInstallationByIDs(ctx, installationIDs, models.GIT_TYPE_GITHUB)
	if err != nil {
		return err
	}

	log.Debug().Msgf("Found %d github installations for user %s", len(gitInstallations), userID)

	teamsToSync := []models.Team{}

	for _, installation := range installationIDs {
		found := false

		for _, gitInstallation := range gitInstallations {
			if gitInstallation.InstallationID == installation {
				found = true
				break
			}
		}

		if !found {
			ghClient, err := NewGithubAppClient()
			if err != nil {
				return err
			}

			app, err := ghClient.GetInstallationInfo(ctx, installation)
			if err != nil {
				return err
			}

			if IsUserInstallation(*app) {
				if app.Account.GetLogin() != githubUser.GetLogin() {
					// Users may be able to see installations for other users, we should skip these
					continue
				}
				team, _, err := LinkPersonalGithubTeam(ctx, models.User{
					ID: userID,
				}, installation)
				if err != nil {
					return err
				}

				teamsToSync = append(teamsToSync, team)

			} else if IsOrgInstallation(*app) {
				team, _, err := LinkOrgGithubTeam(ctx, models.User{
					ID: userID,
				}, app, installation)
				if err != nil {
					return err
				}

				teamsToSync = append(teamsToSync, team)
			}
		}
	}

	errors := make(chan error, len(teamsToSync))
	for _, team := range teamsToSync {
		log.Debug().Msgf("Syncing team members for team %s", team.ID)
		go func(team models.Team, errors chan error) {
			ctx := context.Background()

			if err := SyncGithubTeamMembers(ctx, team); err != nil {
				log.Error().Err(err).Msgf("Failed to sync team members for team %s", team.ID)
				errors <- err
				return
			}

			db, err := database.OpenDBConnection()
			if err != nil {
				log.Err(err).Msgf("Failed to open db connection")
				errors <- err
				return
			}

			projects, err := db.GetTeamsProjects(ctx, team.ID)
			if err != nil && err != sql.ErrNoRows {
				log.Err(err).Msgf("Failed to get projects for team %s", team.ID)
				errors <- err
				return
			} else if len(projects) == 0 {
				errors <- nil
				return
			}

			for _, project := range projects {
				if err := SyncGithubProjectMembers(ctx, team, project); err != nil {
					log.Error().Err(err).Msgf("Failed to sync project members for team %s", team.ID)
					errors <- err
					return
				}
			}

			errors <- nil
		}(team, errors)
	}

	for i := 0; i < len(teamsToSync); i++ {
		err := <-errors
		if err != nil {
			return err
		}
	}

	return nil
}
