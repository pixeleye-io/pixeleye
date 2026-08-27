package git_bitbucketserver

import (
	"context"
	"database/sql"
	"fmt"
	"net/url"
	"strconv"
	"strings"

	"github.com/rs/zerolog/log"

	"github.com/pixeleye-io/pixeleye/app/models"
	bitbucket_queries "github.com/pixeleye-io/pixeleye/app/queries/bitbucket"
	team_queries "github.com/pixeleye-io/pixeleye/app/queries/team"
	"github.com/pixeleye-io/pixeleye/platform/database"
)

type bbsUser struct {
	ID           int    `json:"id"`
	Name         string `json:"name"`
	DisplayName  string `json:"displayName"`
	EmailAddress string `json:"emailAddress"`
}

type bbsRepo struct {
	Slug    string `json:"slug"`
	Name    string `json:"name"`
	Public  bool   `json:"public"`
	Project struct {
		Key string `json:"key"`
	} `json:"project"`
	Links struct {
		Self []struct {
			Href string `json:"href"`
		} `json:"self"`
	} `json:"links"`
}

type pagedResponse[T any] struct {
	Values        []T  `json:"values"`
	IsLastPage    bool `json:"isLastPage"`
	NextPageStart int  `json:"nextPageStart"`
}

type permissionEntry struct {
	User       bbsUser `json:"user"`
	Permission string  `json:"permission"`
}

// GetInstallationRepositories fetches a single page of repos the token can read. name
// filters server-side via Bitbucket Server's own "repos" search param. projectKey scopes
// to a single project by its key (e.g. "VIA", the identifier visible everywhere in repo
// URLs) rather than Bitbucket's own "projectname" filter, which matches the project's
// display name instead - not what someone typing the key they see in the UI would expect.
//
// Returns the API's own nextPageStart rather than letting the caller assume start+limit:
// when filtering by permission (the unfiltered "all repos" listing always does), Bitbucket
// Server paginates over the underlying unfiltered set *before* applying the permission
// filter, so returned page sizes can be smaller than the requested limit even mid-listing -
// recomputing the next offset from start+len(repos) skips or duplicates repos across pages
// once the token can't see every repo in between.
func (c *BitbucketServerClient) GetInstallationRepositories(ctx context.Context, start int, name string, projectKey string) ([]models.GitRepo, int, bool, error) {
	query := url.Values{}
	query.Set("limit", "25")
	query.Set("start", strconv.Itoa(start))
	if name != "" {
		query.Set("name", name)
	}

	var path string
	if projectKey != "" {
		path = fmt.Sprintf("/rest/api/1.0/projects/%s/repos?%s", url.PathEscape(strings.ToUpper(projectKey)), query.Encode())
	} else {
		query.Set("permission", "REPO_READ")
		path = "/rest/api/1.0/repos?" + query.Encode()
	}

	var page pagedResponse[bbsRepo]

	if err := c.get(ctx, path, &page); err != nil {
		if projectKey != "" && strings.Contains(err.Error(), "404") {
			// No project with that key - treat as "no matches" rather than an error, since
			// this is reachable just by mistyping the filter.
			return nil, 0, false, nil
		}
		return nil, 0, false, err
	}

	repos := make([]models.GitRepo, len(page.Values))
	for i, r := range page.Values {
		name := r.Name
		isPrivate := !r.Public
		var repoURL string
		if len(r.Links.Self) > 0 {
			repoURL = r.Links.Self[0].Href
		}

		repos[i] = models.GitRepo{
			ID:      fmt.Sprintf("%s/%s", r.Project.Key, r.Slug),
			Name:    &name,
			Private: &isPrivate,
			URL:     &repoURL,
		}
	}

	return repos, page.NextPageStart, !page.IsLastPage, nil
}

func (c *BitbucketServerClient) getProjectMembers(ctx context.Context, projectKey string) ([]permissionEntry, error) {
	var entries []permissionEntry

	start := 0
	for {
		var page pagedResponse[permissionEntry]
		path := fmt.Sprintf("/rest/api/1.0/projects/%s/permissions/users?limit=100&start=%d", projectKey, start)
		if err := c.get(ctx, path, &page); err != nil {
			return nil, err
		}
		entries = append(entries, page.Values...)
		if page.IsLastPage {
			break
		}
		start = page.NextPageStart
	}

	return entries, nil
}

func (c *BitbucketServerClient) getRepoMembers(ctx context.Context, projectKey, repoSlug string) ([]permissionEntry, error) {
	var entries []permissionEntry

	start := 0
	for {
		var page pagedResponse[permissionEntry]
		path := fmt.Sprintf("/rest/api/1.0/projects/%s/repos/%s/permissions/users?limit=100&start=%d", projectKey, repoSlug, start)
		if err := c.get(ctx, path, &page); err != nil {
			return nil, err
		}
		entries = append(entries, page.Values...)
		if page.IsLastPage {
			break
		}
		start = page.NextPageStart
	}

	return entries, nil
}

// SyncBitbucketServerTeamMembers syncs a team's members using project-level permissions
// across every project the token can see. Bitbucket Server has no OAuth account-linking
// concept, so members are matched to Pixeleye users by email address, which Bitbucket
// Server's user REST representation includes (unlike Bitbucket Cloud's).
func SyncBitbucketServerTeamMembers(ctx context.Context, team models.Team) error {
	if team.Type != models.TEAM_TYPE_BITBUCKET_SERVER {
		return nil
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	client, err := NewBitbucketServerClient(ctx, team.ID)
	if err != nil {
		return err
	}

	projects, err := listAllProjectKeys(ctx, client)
	if err != nil {
		return err
	}

	roleByEmail := map[string]string{}
	for _, projectKey := range projects {
		entries, err := client.getProjectMembers(ctx, projectKey)
		if err != nil {
			log.Warn().Err(err).Msgf("Failed to list members for bitbucket server project %s", projectKey)
			continue
		}
		for _, entry := range entries {
			if entry.User.EmailAddress == "" {
				continue
			}
			role := models.TEAM_MEMBER_ROLE_MEMBER
			if entry.Permission == "PROJECT_ADMIN" {
				role = models.TEAM_MEMBER_ROLE_ADMIN
			}
			// Highest permission across projects wins.
			if roleByEmail[entry.User.EmailAddress] != models.TEAM_MEMBER_ROLE_ADMIN {
				roleByEmail[entry.User.EmailAddress] = role
			}
		}
	}

	currentMembers, err := db.GetUsersOnTeam(ctx, team.ID)
	if err != nil {
		return err
	}

	var membersToAdd []models.TeamMember
	matchedUserIDs := map[string]bool{}

	for email, role := range roleByEmail {
		user, err := db.GetUserByEmail(ctx, email)
		if err != nil {
			if err != sql.ErrNoRows {
				log.Err(err).Msg("Failed to look up bitbucket server user by email")
			}
			continue
		}

		matchedUserIDs[user.ID] = true

		found := false
		for _, currentMember := range currentMembers {
			if currentMember.ID == user.ID {
				found = true
				if currentMember.Type == models.TEAM_MEMBER_TYPE_INVITED {
					if err := db.UpdateUserTypeOnTeam(ctx, team.ID, currentMember.ID, models.TEAM_MEMBER_TYPE_GIT, false); err != nil {
						log.Err(err).Msg("Failed to update user type on team")
					}
				} else if currentMember.RoleSync && currentMember.Role != role {
					if err := db.UpdateUserRoleOnTeam(ctx, team.ID, currentMember.ID, role, true); err != nil {
						log.Err(err).Msg("Failed to update user role on team")
					}
				}
				break
			}
		}

		if !found {
			membersToAdd = append(membersToAdd, models.TeamMember{
				UserID:   user.ID,
				TeamID:   team.ID,
				Type:     models.TEAM_MEMBER_TYPE_GIT,
				Role:     role,
				RoleSync: true,
			})
		}
	}

	var membersToRemove []string
	for _, currentMember := range currentMembers {
		if currentMember.Type != models.TEAM_MEMBER_TYPE_GIT || matchedUserIDs[currentMember.ID] {
			continue
		}
		if isInvited, err := db.IsUserInvitedToProjects(ctx, team.ID, currentMember.ID); err != nil {
			continue
		} else if isInvited || currentMember.Role == models.TEAM_MEMBER_ROLE_OWNER {
			if err := db.UpdateUserTypeOnTeam(ctx, team.ID, currentMember.ID, models.TEAM_MEMBER_TYPE_INVITED, false); err != nil {
				log.Err(err).Msg("Failed to update user type on team")
			}
		} else {
			membersToRemove = append(membersToRemove, currentMember.ID)
		}
	}

	if len(membersToRemove) > 0 {
		if err := db.RemoveTeamMembers(ctx, team.ID, membersToRemove); err != nil {
			return err
		}
	}
	if len(membersToAdd) > 0 {
		if err := db.AddTeamMembers(ctx, membersToAdd); err != nil {
			return err
		}
	}

	return nil
}

// SyncBitbucketServerProjectMembers syncs a Pixeleye project's members from the
// corresponding Bitbucket Server repo's explicit user permissions.
func SyncBitbucketServerProjectMembers(ctx context.Context, team models.Team, project models.Project) error {
	if project.Source != models.SOURCE_BITBUCKET_SERVER {
		return fmt.Errorf("project %s is not a bitbucket server project", project.ID)
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	client, err := NewBitbucketServerClient(ctx, team.ID)
	if err != nil {
		return err
	}

	projectKey, repoSlug, err := splitRepoID(project.SourceID)
	if err != nil {
		return err
	}

	entries, err := client.getRepoMembers(ctx, projectKey, repoSlug)
	if err != nil {
		return err
	}

	projectMembers, err := db.GetProjectUsers(ctx, project)
	if err != nil {
		return err
	}

	var viewerCollaborators, reviewerCollaborators, adminCollaborators []string
	matchedUserIDs := map[string]bool{}

	for _, entry := range entries {
		if entry.User.EmailAddress == "" {
			continue
		}

		user, err := db.GetUserByEmail(ctx, entry.User.EmailAddress)
		if err != nil {
			continue
		}

		matchedUserIDs[user.ID] = true

		manuallySet := false
		for _, projectMember := range projectMembers {
			if projectMember.ID == user.ID && !projectMember.RoleSync {
				manuallySet = true
				break
			}
		}
		if manuallySet {
			continue
		}

		switch entry.Permission {
		case "REPO_ADMIN":
			adminCollaborators = append(adminCollaborators, user.ID)
		case "REPO_WRITE":
			reviewerCollaborators = append(reviewerCollaborators, user.ID)
		case "REPO_READ":
			viewerCollaborators = append(viewerCollaborators, user.ID)
		}
	}

	var membersToRemove []string
	for _, member := range projectMembers {
		if member.RoleSync && !matchedUserIDs[member.ID] {
			membersToRemove = append(membersToRemove, member.ID)
		}
	}

	if len(membersToRemove) > 0 {
		if err := db.RemoveUsersFromProject(ctx, project.ID, membersToRemove); err != nil {
			return err
		}
	}
	if len(viewerCollaborators) > 0 {
		if err := db.AddUsersToProject(ctx, project.ID, viewerCollaborators, models.PROJECT_MEMBER_ROLE_VIEWER, true, "git"); err != nil {
			return err
		}
	}
	if len(reviewerCollaborators) > 0 {
		if err := db.AddUsersToProject(ctx, project.ID, reviewerCollaborators, models.PROJECT_MEMBER_ROLE_REVIEWER, true, "git"); err != nil {
			return err
		}
	}
	if len(adminCollaborators) > 0 {
		if err := db.AddUsersToProject(ctx, project.ID, adminCollaborators, models.PROJECT_MEMBER_ROLE_ADMIN, true, "git"); err != nil {
			return err
		}
	}

	return nil
}

func splitRepoID(sourceID string) (projectKey string, repoSlug string, err error) {
	for i := 0; i < len(sourceID); i++ {
		if sourceID[i] == '/' {
			return sourceID[:i], sourceID[i+1:], nil
		}
	}
	return "", "", fmt.Errorf("invalid bitbucket server repo id: %s", sourceID)
}

func listAllProjectKeys(ctx context.Context, client *BitbucketServerClient) ([]string, error) {
	keys := map[string]bool{}
	start := 0
	for {
		var page pagedResponse[bbsRepo]
		path := fmt.Sprintf("/rest/api/1.0/repos?permission=REPO_READ&limit=100&start=%d", start)
		if err := client.get(ctx, path, &page); err != nil {
			return nil, err
		}
		for _, r := range page.Values {
			keys[r.Project.Key] = true
		}
		if page.IsLastPage {
			break
		}
		start = page.NextPageStart
	}

	result := make([]string, 0, len(keys))
	for k := range keys {
		result = append(result, k)
	}
	return result, nil
}

// LinkBitbucketServerTeam creates the Pixeleye Team + GitInstallation for a manually
// entered Bitbucket Server connection. There's no workspace/org to discover, so the team
// name is user-provided.
func LinkBitbucketServerTeam(ctx context.Context, user models.User, teamName, baseURL, accessToken string) (models.Team, models.GitInstallation, error) {
	db, err := database.OpenDBConnection()
	if err != nil {
		return models.Team{}, models.GitInstallation{}, err
	}

	tx, err := bitbucket_queries.NewBitbucketTx(db.BitbucketQueries.DB, ctx)
	if err != nil {
		return models.Team{}, models.GitInstallation{}, err
	}

	completed := false
	defer func() {
		if !completed {
			if err := tx.Rollback(); err != nil {
				log.Error().Err(err).Msg("Failed to rollback bitbucket server tx")
			}
		}
	}()

	ttx := team_queries.TeamQueriesTx{Tx: tx.Tx}

	team := models.Team{
		Type: models.TEAM_TYPE_BITBUCKET_SERVER,
		Name: teamName,
		URL:  baseURL,
		Role: models.TEAM_MEMBER_ROLE_OWNER,
	}

	if err := ttx.CreateTeam(ctx, &team, user); err != nil {
		return models.Team{}, models.GitInstallation{}, err
	}

	installation, err := tx.CreateBitbucketInstallation(ctx, bitbucket_queries.InstallationParams{
		Type:           models.GIT_TYPE_BITBUCKET_SERVER,
		InstallationID: team.ID,
		TeamID:         team.ID,
		AccessToken:    &accessToken,
		BaseURL:        &baseURL,
	})
	if err != nil {
		return models.Team{}, models.GitInstallation{}, err
	}

	if err := tx.Commit(); err != nil {
		return models.Team{}, models.GitInstallation{}, err
	}
	completed = true

	return team, installation, nil
}
