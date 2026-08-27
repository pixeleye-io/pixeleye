package git_bitbucket

import (
	"context"
	"database/sql"
	"fmt"
	"net/url"
	"strings"
	"time"

	"github.com/rs/zerolog/log"

	bitbucket_queries "github.com/pixeleye-io/pixeleye/app/queries/bitbucket"

	"github.com/pixeleye-io/pixeleye/app/models"
	team_queries "github.com/pixeleye-io/pixeleye/app/queries/team"
	"github.com/pixeleye-io/pixeleye/platform/database"
)

// escapeBBQL escapes double quotes and backslashes for a Bitbucket Query Language string
// literal, so user-supplied search text can't break out of the quoted term.
func escapeBBQL(s string) string {
	s = strings.ReplaceAll(s, `\`, `\\`)
	s = strings.ReplaceAll(s, `"`, `\"`)
	return s
}

type bbUser struct {
	AccountID   string `json:"account_id"`
	UUID        string `json:"uuid"`
	DisplayName string `json:"display_name"`
	Nickname    string `json:"nickname"`
}

type bbWorkspace struct {
	UUID string `json:"uuid"`
	Slug string `json:"slug"`
	Name string `json:"name"`
}

type bbRepository struct {
	UUID        string `json:"uuid"`
	Name        string `json:"name"`
	FullName    string `json:"full_name"`
	IsPrivate   bool   `json:"is_private"`
	Description string `json:"description"`
	UpdatedOn   string `json:"updated_on"`
	Links       struct {
		HTML struct {
			Href string `json:"href"`
		} `json:"html"`
	} `json:"links"`
	MainBranch struct {
		Name string `json:"name"`
	} `json:"mainbranch"`
	Workspace bbWorkspace `json:"workspace"`
}

type paginated[T any] struct {
	Values []T    `json:"values"`
	Next   string `json:"next"`
}

type workspacePermission struct {
	Permission string `json:"permission"` // "owner" | "collaborator" | "member"
	User       bbUser `json:"user"`
}

type repoPermission struct {
	Permission string `json:"permission"` // "admin" | "write" | "read"
	User       bbUser `json:"user"`
}

func (c *BitbucketCloudClient) GetCurrentUser(ctx context.Context) (*bbUser, error) {
	var user bbUser
	if err := c.get(ctx, "/user", &user); err != nil {
		return nil, err
	}
	return &user, nil
}

func (c *BitbucketCloudClient) GetWorkspaces(ctx context.Context) ([]bbWorkspace, error) {
	var workspaces []bbWorkspace

	path := "/workspaces?role=member&pagelen=100"
	for path != "" {
		var page paginated[bbWorkspace]
		if err := c.get(ctx, path, &page); err != nil {
			return nil, err
		}
		workspaces = append(workspaces, page.Values...)
		path = page.Next
	}

	return workspaces, nil
}

// GetInstallationRepositories fetches a single page of repos (Bitbucket Cloud paginates via
// an opaque "next" URL rather than a page number). name/project filter server-side via
// Bitbucket's query language instead of the caller having to page through everything -
// important for workspaces with thousands of repos.
func (c *BitbucketCloudClient) GetInstallationRepositories(ctx context.Context, workspace string, next string, name string, project string) ([]models.GitRepo, string, error) {
	path := next
	if path == "" {
		query := url.Values{}
		query.Set("role", "member")
		query.Set("pagelen", "25")

		var terms []string
		if name != "" {
			terms = append(terms, fmt.Sprintf(`name~"%s"`, escapeBBQL(name)))
		}
		if project != "" {
			// Match by project key (e.g. "VIA"), the identifier visible everywhere in
			// Bitbucket's UI/URLs, not the (possibly different) display name.
			terms = append(terms, fmt.Sprintf(`project.key="%s"`, escapeBBQL(strings.ToUpper(project))))
		}
		if len(terms) > 0 {
			query.Set("q", strings.Join(terms, " AND "))
		}

		path = fmt.Sprintf("/repositories/%s?%s", workspace, query.Encode())
	}

	var page paginated[bbRepository]
	if err := c.get(ctx, path, &page); err != nil {
		return nil, "", err
	}

	repos := make([]models.GitRepo, len(page.Values))
	for i, r := range page.Values {
		isPrivate := r.IsPrivate
		desc := r.Description
		repoURL := r.Links.HTML.Href
		branch := r.MainBranch.Name

		repo := models.GitRepo{
			ID:            r.UUID,
			Name:          &r.Name,
			Private:       &isPrivate,
			URL:           &repoURL,
			Description:   &desc,
			DefaultBranch: &branch,
		}

		if updatedOn, err := time.Parse(time.RFC3339, r.UpdatedOn); err == nil {
			repo.LastUpdated = &updatedOn
		}

		repos[i] = repo
	}

	return repos, page.Next, nil
}

func (c *BitbucketCloudClient) getWorkspacePermissions(ctx context.Context, workspace string) ([]workspacePermission, error) {
	var permissions []workspacePermission

	path := fmt.Sprintf("/workspaces/%s/permissions?pagelen=100", workspace)
	for path != "" {
		var page paginated[workspacePermission]
		if err := c.get(ctx, path, &page); err != nil {
			return nil, err
		}
		permissions = append(permissions, page.Values...)
		path = page.Next
	}

	return permissions, nil
}

func (c *BitbucketCloudClient) getRepoPermissions(ctx context.Context, workspace, repoSlug string) ([]repoPermission, error) {
	var permissions []repoPermission

	path := fmt.Sprintf("/repositories/%s/%s/permissions-config/users?pagelen=100", workspace, repoSlug)
	for path != "" {
		var page paginated[repoPermission]
		if err := c.get(ctx, path, &page); err != nil {
			// This endpoint requires the connecting user to have workspace-admin
			// permission; degrade gracefully rather than failing the whole sync.
			log.Warn().Err(err).Msgf("Failed to fetch repo permissions for %s/%s, skipping project member sync", workspace, repoSlug)
			return nil, nil
		}
		permissions = append(permissions, page.Values...)
		path = page.Next
	}

	return permissions, nil
}

// SyncBitbucketTeamMembers syncs a team's members from the connected workspace's
// permissions. Members are matched to Pixeleye users via a linked Bitbucket account
// (Account.Provider = "bitbucket", ProviderAccountID = Bitbucket account_id) — a user who
// hasn't linked their Bitbucket account won't be auto-synced, matching the existing
// project-member-invite fallback path.
func SyncBitbucketTeamMembers(ctx context.Context, team models.Team) error {
	if team.Type != models.TEAM_TYPE_BITBUCKET {
		return nil
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	installation, err := db.GetGitInstallation(ctx, team.ID, models.TEAM_TYPE_BITBUCKET)
	if err != nil {
		return err
	}

	client, err := NewBitbucketCloudClient(ctx, installation.InstallationID)
	if err != nil {
		return err
	}

	permissions, err := client.getWorkspacePermissions(ctx, installation.InstallationID)
	if err != nil {
		return err
	}

	currentMembers, err := db.GetUsersOnTeam(ctx, team.ID)
	if err != nil {
		return err
	}

	var membersToRemove []string
	var membersToAdd []models.TeamMember

	matchedUserIDs := map[string]bool{}

	for _, perm := range permissions {
		user, err := db.GetUserByProviderID(ctx, perm.User.AccountID, models.ACCOUNT_PROVIDER_BITBUCKET)
		if err != nil {
			if err != sql.ErrNoRows {
				log.Err(err).Msg("Failed to look up bitbucket user")
			}
			continue
		}

		role := models.TEAM_MEMBER_ROLE_MEMBER
		if perm.Permission == "owner" || perm.Permission == "collaborator" {
			role = models.TEAM_MEMBER_ROLE_ADMIN
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

	for _, currentMember := range currentMembers {
		if currentMember.Type != models.TEAM_MEMBER_TYPE_GIT || matchedUserIDs[currentMember.ID] {
			continue
		}

		if isInvited, err := db.IsUserInvitedToProjects(ctx, team.ID, currentMember.ID); err != nil {
			log.Err(err).Msg("Failed to check if user is invited to projects")
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

// SyncBitbucketProjectMembers syncs a project's members from the connected repository's
// explicit user permissions. See SyncBitbucketTeamMembers for the matching caveat.
func SyncBitbucketProjectMembers(ctx context.Context, team models.Team, project models.Project) error {
	if project.Source != models.SOURCE_BITBUCKET {
		return fmt.Errorf("project %s is not a bitbucket project", project.ID)
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	installation, err := db.GetGitInstallation(ctx, team.ID, models.TEAM_TYPE_BITBUCKET)
	if err != nil {
		return err
	}

	client, err := NewBitbucketCloudClient(ctx, installation.InstallationID)
	if err != nil {
		return err
	}

	// project.SourceID is the repo's full_name ("workspace/repo_slug")
	workspace, repoSlug, err := splitFullName(project.SourceID)
	if err != nil {
		return err
	}

	permissions, err := client.getRepoPermissions(ctx, workspace, repoSlug)
	if err != nil {
		return err
	}

	if permissions == nil {
		// Permission listing wasn't available (needs workspace-admin) - skip rather than
		// remove everyone.
		return nil
	}

	projectMembers, err := db.GetProjectUsers(ctx, project)
	if err != nil {
		return err
	}

	var viewerCollaborators, reviewerCollaborators, adminCollaborators []string
	matchedUserIDs := map[string]bool{}

	for _, perm := range permissions {
		user, err := db.GetUserByProviderID(ctx, perm.User.AccountID, models.ACCOUNT_PROVIDER_BITBUCKET)
		if err != nil {
			continue
		}

		matchedUserIDs[user.ID] = true

		// Don't override a role the user (or an admin) set manually.
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

		switch perm.Permission {
		case "admin":
			adminCollaborators = append(adminCollaborators, user.ID)
		case "write":
			reviewerCollaborators = append(reviewerCollaborators, user.ID)
		case "read":
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

func splitFullName(fullName string) (workspace string, repoSlug string, err error) {
	for i := 0; i < len(fullName); i++ {
		if fullName[i] == '/' {
			return fullName[:i], fullName[i+1:], nil
		}
	}
	return "", "", fmt.Errorf("invalid bitbucket repo full name: %s", fullName)
}

// LinkBitbucketTeam creates (or re-links) the Pixeleye Team + GitInstallation for a
// Bitbucket Cloud workspace the connecting user authorized.
func LinkBitbucketTeam(ctx context.Context, user models.User, workspace bbWorkspace, tokens *TokenResponse) (models.Team, models.GitInstallation, error) {
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
				log.Error().Err(err).Msg("Failed to rollback bitbucket tx")
			}
		}
	}()

	team, err := db.GetTeamFromExternalID(ctx, workspace.UUID)

	expiresAt := time.Now().Add(time.Duration(tokens.ExpiresIn) * time.Second)

	if err == sql.ErrNoRows {
		ttx := team_queries.TeamQueriesTx{Tx: tx.Tx}

		team = models.Team{
			Type:       models.TEAM_TYPE_BITBUCKET,
			Name:       workspace.Name,
			URL:        fmt.Sprintf("https://bitbucket.org/%s", workspace.Slug),
			Role:       models.TEAM_MEMBER_ROLE_OWNER,
			ExternalID: workspace.UUID,
		}

		if err := ttx.CreateTeam(ctx, &team, user); err != nil {
			return models.Team{}, models.GitInstallation{}, err
		}
	} else if err != nil {
		return models.Team{}, models.GitInstallation{}, err
	}

	existingInstallation, err := db.GetTeamInstallation(ctx, team.ID)
	if err != nil && err != sql.ErrNoRows {
		return models.Team{}, models.GitInstallation{}, err
	}

	if err != sql.ErrNoRows {
		existingInstallation.InstallationID = workspace.Slug
		existingInstallation.AccessToken = &tokens.AccessToken
		existingInstallation.RefreshToken = &tokens.RefreshToken
		existingInstallation.TokenExpiresAt = &expiresAt

		if err := tx.UpdateBitbucketInstallation(ctx, &existingInstallation); err != nil {
			return models.Team{}, models.GitInstallation{}, err
		}

		if err := tx.Commit(); err != nil {
			return models.Team{}, models.GitInstallation{}, err
		}
		completed = true

		return team, existingInstallation, nil
	}

	installation, err := tx.CreateBitbucketInstallation(ctx, bitbucket_queries.InstallationParams{
		Type:           models.GIT_TYPE_BITBUCKET,
		InstallationID: workspace.Slug,
		TeamID:         team.ID,
		AccessToken:    &tokens.AccessToken,
		RefreshToken:   &tokens.RefreshToken,
		TokenExpiresAt: &expiresAt,
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
