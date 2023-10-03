package Team_queries

import (
	"context"

	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
	nanoid "github.com/matoous/go-nanoid/v2"

	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
)

func (q *TeamQueriesTx) CreateTeam(ctx context.Context, team *models.Team, creatorID string) error {
	createTeamQuery := `INSERT INTO team (id, name, type, avatar_url, url, created_at, updated_at, owner_id, external_id) VALUES (:id, :name, :type, :avatar_url, :url, :created_at, :updated_at, :owner_id, :external_id)`
	createUserOnTeamQuery := `INSERT INTO team_users (team_id, user_id, role, type) VALUES (:team_id, :user_id, :role, :type)`

	timeNow := utils.CurrentTime()

	id, err := nanoid.New()

	if err != nil {
		return err
	}

	team.ID = id
	team.CreatedAt = timeNow
	team.UpdatedAt = timeNow
	team.Role = models.TEAM_MEMBER_ROLE_OWNER

	if team.Type == models.TEAM_TYPE_USER {
		// This ensures that the a user can only ever have one personal team.
		// They can own as many other teams as they want.
		team.OwnerID = &creatorID
	}

	if _, err = q.NamedExecContext(ctx, createTeamQuery, team); err != nil {
		return err
	}

	teamType := models.TEAM_MEMBER_TYPE_INVITED
	if team.Type != models.TEAM_TYPE_USER {
		teamType = models.TEAM_MEMBER_TYPE_GIT
	}

	userOnTeam := models.TeamMember{
		TeamID: team.ID,
		UserID: creatorID,
		Role:   models.TEAM_MEMBER_ROLE_OWNER,
		Type:   teamType,
	}

	if _, err = q.NamedExecContext(ctx, createUserOnTeamQuery, userOnTeam); err != nil {
		return err
	}

	return nil
}

func (q *TeamQueriesTx) RemoveTeamMembers(ctx context.Context, teamID string, memberIDs []string) error {
	query := `DELETE FROM team_users WHERE team_id = ? AND id IN (?)`
	projectQuery := `DELETE FROM project_users LEFT JOIN project ON project_users.project_id = project.id WHERE project.team_id = ? AND project_users.user_id IN (?)`

	query, args, err := sqlx.In(query, teamID, pq.StringArray(memberIDs))

	if err != nil {
		return err
	}

	query = q.Rebind(query)

	_, err = q.ExecContext(ctx, query, args...)
	if err != nil {
		return err
	}

	projectQuery, args, err = sqlx.In(projectQuery, teamID, pq.StringArray(memberIDs))
	if err != nil {
		return err
	}

	projectQuery = q.Rebind(projectQuery)

	_, err = q.ExecContext(ctx, projectQuery, args...)

	return err
}

func (q *TeamQueries) RemoveTeamMember(ctx context.Context, memberID string) error {
	query := `DELETE FROM team_users WHERE id = ?`

	_, err := q.ExecContext(ctx, query, memberID)

	return err
}

func (q *TeamQueries) AddTeamMembers(ctx context.Context, members []models.TeamMember) error {
	query := `INSERT INTO team_users (team_id, user_id, role, role_sync, type) VALUES (:team_id, :user_id, :role, :role_sync, :type)`

	_, err := q.NamedExecContext(ctx, query, members)

	return err
}

func (q *TeamQueries) UpdateUserRoleOnTeam(ctx context.Context, teamID string, memberID string, role string) error {
	query := `UPDATE team_users SET role = $1 WHERE user_id = $2 AND team_id = $3`

	_, err := q.ExecContext(ctx, query, role, memberID, teamID)

	return err
}

func (q *TeamQueries) UpdateUserTypeOnTeam(ctx context.Context, teamID string, userID string, userType string, roleSync bool) error {
	query := `UPDATE team_users SET type = $1, role_sync = $2 WHERE user_id = $3 AND team_id = $4`

	_, err := q.ExecContext(ctx, query, userType, roleSync, userID)

	return err
}
