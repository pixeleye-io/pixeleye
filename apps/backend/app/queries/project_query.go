package queries

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/rs/zerolog/log"

	nanoid "github.com/matoous/go-nanoid/v2"
)

type ProjectQueries struct {
	*sqlx.DB
}

func (q *ProjectQueries) GetLatestBuild(projectID string) (models.Build, error) {
	build := models.Build{}

	query := `SELECT * FROM build WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1`

	err := q.Get(&build, query, projectID)

	return build, err
}

func (q *ProjectQueries) GetTeamsProjectsAsUser(teamID string, userID string) ([]models.Project, error) {
	query := `SELECT project.*, project_users.role, team_users.role AS team_role, (SELECT MAX(created_at) FROM build WHERE project_id = project.id) AS last_activity
	FROM project
	JOIN project_users ON project.id = project_users.project_id
	JOIN team ON project.team_id = team.id
	JOIN team_users ON team.id = team_users.team_id
	WHERE project.team_id = $1
	AND team_users.user_id = $2
	AND (
		project_users.user_id = $2
		OR (
			team_users.user_id = $2
			AND (
				(team_users.role = 'admin'
				OR team_users.role = 'owner') AND project_users.user_id IS NULL
			)
		)
	)`

	projects := []models.Project{}

	if err := q.Select(&projects, query, teamID, userID); err != nil {
		return projects, err
	}

	return projects, nil
}

// There is no access control on this query, so be careful where you use it
func (q *ProjectQueries) GetProject(ctx context.Context, id string) (models.Project, error) {
	project := models.Project{}

	query := `SELECT * FROM project WHERE id = $1`

	err := q.Get(&project, query, id)

	return project, err
}

func (q *ProjectQueries) CreateProjectInvite(ctx context.Context, projectID string, userID string, role string, email string) (models.ProjectInviteCode, error) {
	query := `INSERT INTO project_invite_code (id, project_id, created_at, expires_at, role, email, invited_by_id) VALUES (:id, :project_id, :created_at, :expires_at, :role, :email, :invited_by_id)`

	id, err := nanoid.New()
	if err != nil {
		return models.ProjectInviteCode{}, err
	}

	inviteCode := models.ProjectInviteCode{
		ID:          id,
		ProjectID:   projectID,
		CreatedAt:   time.Now(),
		ExpiresAt:   time.Now().Add(time.Hour * 24 * 7),
		Role:        role,
		Email:       email,
		InvitedByID: userID,
	}

	_, err = q.NamedExecContext(ctx, query, inviteCode)

	return inviteCode, err
}

type ProjectInvite struct {
	*models.ProjectInviteCode
	ProjectName      string `db:"project_name" json:"projectName"`
	InviterEmail     string `db:"inviter_email" json:"inviterEmail"`
	InviterName      string `db:"inviter_name" json:"inviterName"`
	InviterAvatarURL string `db:"inviter_avatar_url" json:"inviterAvatarURL"`
	TeamAvatarURL    string `db:"team_avatar_url" json:"teamAvatarURL"`
	TeamName         string `db:"team_name" json:"teamName"`
}

func (q *ProjectQueries) GetProjectInviteData(ctx context.Context, id string) (ProjectInvite, error) {
	query := `SELECT project_invite_code.*, project.name AS project_name, users.email AS inviter_email, users.name AS inviter_name, users.avatar_url AS inviter_avatar_url, team.avatar_url AS team_avatar_url, team.name AS team_name
	FROM project_invite_code
	JOIN project ON project.id = project_invite_code.project_id
	JOIN users ON users.id = project_invite_code.invited_by_id
	JOIN team ON team.id = project.team_id
	WHERE project_invite_code.id = $1`

	inviteCode := ProjectInvite{}

	err := q.GetContext(ctx, &inviteCode, query, id)

	return inviteCode, err
}

func (q *ProjectQueries) GetProjectInvite(ctx context.Context, id string) (models.ProjectInviteCode, error) {
	query := `SELECT * FROM project_invite_code WHERE id = $1`

	inviteCode := models.ProjectInviteCode{}

	err := q.GetContext(ctx, &inviteCode, query, id)

	return inviteCode, err
}

func (q *ProjectQueries) DeleteProjectInvite(ctx context.Context, id string) error {
	query := `DELETE FROM project_invite_code WHERE id = $1`

	_, err := q.ExecContext(ctx, query, id)

	return err
}

func (q *ProjectQueries) GetProjectAsUser(id string, userID string) (models.Project, error) {
	project := models.Project{}

	query := `SELECT project.*, project_users.role, team_users.role AS team_role
	FROM project
	JOIN project_users ON project.id = project_users.project_id
	JOIN team ON project.team_id = team.id
	JOIN team_users ON team.id = team_users.team_id
	WHERE project.id = $1
	AND (
		project_users.user_id = $2
		AND team_users.user_id = $2
	)`

	err := q.Get(&project, query, id, userID)

	if err == sql.ErrNoRows {
		return project, fmt.Errorf("project not found")
	}

	log.Debug().Msgf("project: %+v", project)

	return project, err
}

func (q *ProjectQueries) CreateProject(project *models.Project, userID string) error {
	query := `INSERT INTO project (id, team_id, name, source, source_id, token, created_at, updated_at, url) VALUES (:id, :team_id, :name, :source, :source_id, :token, :created_at, :updated_at, :url)`
	setUsersQuery := `INSERT INTO project_users (project_id, user_id, role, type) VALUES (:project_id, :user_id, :role, :type)`

	time := utils.CurrentTime()
	project.CreatedAt = time
	project.UpdatedAt = time

	userOnProject := models.ProjectMember{
		ProjectID: project.ID,
		UserID:    userID,
		Role:      "admin",
		RoleSync:  false,
		Type:      "git",
	}

	if project.Source == models.SOURCE_CUSTOM {
		userOnProject.Type = "invited"
	}

	ctx := context.Background()
	tx, err := q.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}

	// nolint:errcheck
	defer tx.Rollback()

	if _, err = tx.NamedExecContext(ctx, query, project); err != nil {
		return err
	}

	if _, err = tx.NamedExecContext(ctx, setUsersQuery, userOnProject); err != nil {
		return err
	}

	return tx.Commit()
}

func (q *ProjectQueries) UpdateProject(project *models.Project) error {
	query := `UPDATE project SET name = :name, source = :source, source_id = :source_id, token = :token WHERE id = :id`

	project.UpdatedAt = time.Now()

	_, err := q.NamedExec(query, project)

	return err
}

func (q *ProjectQueries) DeleteProject(id string) error {
	query := `DELETE FROM project WHERE id = $1`

	_, err := q.Exec(query, id)

	return err
}

type UserOnProject struct {
	*models.User
	Role     string `db:"role" json:"role"`
	RoleSync bool   `db:"role_sync" json:"roleSync"`
	Type     string `db:"type" json:"type"`
}

func (q *ProjectQueries) GetProjectUsers(ctx context.Context, projectID string) ([]UserOnProject, error) {
	query := `SELECT users.*, project_users.role, project_users.type, project_users.role_sync, COALESCE(github_account.provider_account_id, '') as github_id 
	FROM users 
	JOIN project_users ON project_users.user_id = users.id 
	LEFT JOIN account github_account ON users.id = github_account.user_id AND github_account.provider = 'github' 
	WHERE project_id = $1`

	projectUsers := []UserOnProject{}

	err := q.Select(&projectUsers, query, projectID)

	return projectUsers, err
}

func (q *ProjectQueries) GetProjectUser(projectID string, userID string) (models.ProjectMember, error) {
	query := `SELECT * FROM project_users WHERE project_id = $1 AND user_id = $2`

	projectUser := models.ProjectMember{}

	err := q.Get(&projectUser, query, projectID, userID)

	return projectUser, err
}

func (q *ProjectQueries) IsUserInvitedToProjects(ctx context.Context, teamID string, userID string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM project_users WHERE user_id = $1 AND type = 'invited' AND project_id IN (SELECT id FROM project WHERE team_id = $2))`

	var exists bool

	if err := q.GetContext(ctx, &exists, query, userID, teamID); err != nil {
		return false, err
	}

	return exists, nil

}

func (q *ProjectQueries) IsUserOnProject(ctx context.Context, projectID string, userID string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM project_users WHERE user_id = $1 AND project_id = $2)`

	var exists bool

	if err := q.GetContext(ctx, &exists, query, userID, projectID); err != nil {
		return false, err
	}

	return exists, nil
}

func (q *ProjectQueries) RemoveUserFromAllGitProjects(ctx context.Context, teamID string, userID string) error {
	query := `DELETE FROM project_users WHERE project_id IN (SELECT id FROM project WHERE team_id = $1) AND user_id = $2 AND type = 'git'`

	_, err := q.ExecContext(ctx, query, teamID, userID)

	return err
}

func (q *ProjectQueries) AddUserToProject(ctx context.Context, teamID string, projectID string, userID string, role string) error {
	queryProject := `INSERT INTO project_users (project_id, user_id, role, type) VALUES ($1, $2, $3, 'invited') ON CONFLICT DO NOTHING`
	queryTeam := `INSERT INTO team_users (team_id, user_id, role, type) VALUES ($1, $2, 'member', 'invited') ON CONFLICT DO NOTHING` // If a user is in a project, they should be in the team

	tx, err := q.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}

	// nolint:errcheck
	defer tx.Rollback()

	if _, err = tx.ExecContext(ctx, queryProject, projectID, userID, role); err != nil {
		return err
	}

	if _, err = tx.ExecContext(ctx, queryTeam, teamID, userID); err != nil {
		return err
	}

	return tx.Commit()
}

// Assumes that the user is already on the team
func (q *ProjectQueries) AddUsersToProject(ctx context.Context, projectID string, userIDs []string, role string, roleSync bool, userType string) error {
	query := `INSERT INTO project_users (project_id, user_id, role, role_sync, type) VALUES (:project_id, :user_id, :role, :role_sync, :type) ON CONFLICT (project_id, user_id) DO UPDATE SET role = :role, role_sync = :role_sync`

	for _, userID := range userIDs {
		projectUser := models.ProjectMember{
			ProjectID: projectID,
			UserID:    userID,
			Role:      role,
			RoleSync:  roleSync,
			Type:      userType,
		}

		_, err := q.NamedExecContext(ctx, query, projectUser)

		if err != nil {
			return err
		}
	}

	return nil
}

func (q *ProjectQueries) RemoveUserFromProject(projectID string, userID string) error {
	query := `DELETE FROM project_users WHERE project_id = $1 AND user_id = $2`

	_, err := q.Exec(query, projectID, userID)

	return err
}

func (q *ProjectQueries) RemoveUsersFromProject(ctx context.Context, projectID string, userIDs []string) error {
	query := `DELETE FROM project_users WHERE project_id = ? AND user_id IN (?)`

	query, args, err := sqlx.In(query, projectID, userIDs)
	if err != nil {
		return err
	}

	query = q.Rebind(query)

	_, err = q.ExecContext(ctx, query, args...)

	return err
}

func (q *ProjectQueries) UpdateUserRoleOnProject(ctx context.Context, projectID string, userID string, role string, sync bool) error {
	query := `UPDATE project_users SET role = $1, role_sync = $2 WHERE project_id = $3 AND user_id = $4`

	_, err := q.ExecContext(ctx, query, role, sync, projectID, userID)

	return err
}

func (q *ProjectQueries) GetProjectBuilds(ctx context.Context, projectID string, branch string) ([]models.Build, error) {
	query := `SELECT * FROM build WHERE project_id = $1 ORDER BY created_at DESC`
	queryBranches := `SELECT * FROM build WHERE project_id = $1 AND branch = $2`

	builds := []models.Build{}

	var err error
	if branch == "" {
		err = q.Select(&builds, query, projectID)
	} else {
		err = q.Select(&builds, queryBranches, projectID, branch)
	}

	return builds, err
}

func (q *ProjectQueries) GetUserOnProject(ctx context.Context, projectID string, userID string) (models.ProjectMember, error) {
	query := `SELECT * FROM project_users WHERE project_id = $1 AND user_id = $2`

	projectUser := models.ProjectMember{}

	err := q.GetContext(ctx, &projectUser, query, projectID, userID)

	return projectUser, err
}
