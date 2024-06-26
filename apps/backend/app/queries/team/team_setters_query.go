package Team_queries

import (
	"context"

	"github.com/jmoiron/sqlx"
	nanoid "github.com/matoous/go-nanoid/v2"
	"github.com/posthog/posthog-go"
	"github.com/rs/zerolog/log"

	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/pixeleye-io/pixeleye/platform/analytics"
)

func (q *TeamQueriesTx) CreateTeam(ctx context.Context, team *models.Team, creator models.User) error {
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
		team.OwnerID = &creator.ID
	}

	if _, err = q.NamedExecContext(ctx, createTeamQuery, team); err != nil {
		return err
	}

	teamType := models.TEAM_MEMBER_TYPE_INVITED
	if team.Type != models.TEAM_TYPE_USER {
		teamType = models.TEAM_MEMBER_TYPE_GIT
	}

	userOnTeam := models.TeamMember{
		TeamID:   team.ID,
		UserID:   creator.ID,
		Role:     models.TEAM_MEMBER_ROLE_OWNER,
		RoleSync: false,
		Type:     teamType,
	}

	if _, err = q.NamedExecContext(ctx, createUserOnTeamQuery, userOnTeam); err != nil {
		return err
	}

	analytics.Track(posthog.Capture{
		DistinctId: team.ID,
		Event:      "Team Created",
		Properties: posthog.NewProperties().Set("team_id", team.ID).Set("team_type", team.Type).Set("team_url", team.URL).Set("team_name", team.Name).Set("team_avatar_url", team.AvatarURL).Set("team_owner_id", team.OwnerID),
	})

	analytics.Identify(posthog.Identify{
		DistinctId: team.ID,
		Properties: posthog.NewProperties().Set("team_id", team.ID).Set("team_type", team.Type).Set("team_url", team.URL).Set("team_name", team.Name).Set("team_avatar_url", team.AvatarURL).Set("team_owner_id", team.OwnerID).Set("team_creator_email", creator.Email).Set("team_creator_name", creator.Name),
	})

	return nil
}

func (q *TeamQueries) DeleteTeamInstallation(ctx context.Context, installationID string) error {
	query := `DELETE FROM git_installation WHERE installation_id = $1`

	_, err := q.ExecContext(ctx, query, installationID)

	return err
}

func (q *TeamQueries) RemoveTeamMembers(ctx context.Context, teamID string, memberIDs []string) error {
	query := `DELETE FROM team_users WHERE team_id = ? AND user_id IN (?)`
	projectQuery := `DELETE FROM project_users WHERE project_id IN (SELECT id FROM project WHERE team_id = ?) AND user_id IN (?)`

	tx, err := q.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}

	completed := false
	defer func(completed *bool) {
		if !*completed {
			if err := tx.Rollback(); err != nil {
				log.Error().Err(err).Msg("failed to rollback transaction")
			}
		}
	}(&completed)

	query, args, err := sqlx.In(query, teamID, memberIDs)
	if err != nil {
		return err
	}

	query = tx.Rebind(query)

	_, err = tx.ExecContext(ctx, query, args...)
	if err != nil {
		return err
	}

	projectQuery, args, err = sqlx.In(projectQuery, teamID, memberIDs)
	if err != nil {
		return err
	}

	projectQuery = tx.Rebind(projectQuery)

	_, err = tx.ExecContext(ctx, projectQuery, args...)
	if err != nil {
		return err
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	completed = true

	return nil
}

func (q *TeamQueries) AddTeamMembers(ctx context.Context, members []models.TeamMember) error {
	query := `INSERT INTO team_users (team_id, user_id, role, role_sync, type) VALUES (:team_id, :user_id, :role, :role_sync, :type)`

	_, err := q.NamedExecContext(ctx, query, members)
	if err != nil {
		return err
	}

	for _, member := range members {
		analytics.Track(posthog.Capture{
			DistinctId: member.TeamID,
			Event:      "Team Member Added",
			Properties: posthog.NewProperties().Set("team_id", member.TeamID).Set("user_id", member.UserID).Set("role", member.Role).Set("type", member.Type),
		})
	}

	return nil
}

func (q *TeamQueries) UpdateUserRoleOnTeam(ctx context.Context, teamID string, memberID string, role string, roleSync bool) error {
	query := `UPDATE team_users SET role = $1, role_sync = $2 WHERE user_id = $3 AND team_id = $4`

	_, err := q.ExecContext(ctx, query, role, roleSync, memberID, teamID)

	return err
}

func (q *TeamQueriesTx) UpdateUserRoleOnTeam(ctx context.Context, teamID string, memberID string, role string, roleSync bool) error {
	query := `UPDATE team_users SET role = $1, role_sync = $2 WHERE user_id = $3 AND team_id = $4`

	_, err := q.ExecContext(ctx, query, role, roleSync, memberID, teamID)

	return err
}

func (q *TeamQueries) UpdateUserTypeOnTeam(ctx context.Context, teamID string, userID string, userType string, roleSync bool) error {
	query := `UPDATE team_users SET type = $1, role_sync = $2 WHERE user_id = $3 AND team_id = $4`

	_, err := q.ExecContext(ctx, query, userType, roleSync, userID, teamID)

	return err
}

func (q *TeamQueriesTx) UpdateUserTypeOnTeam(ctx context.Context, teamID string, userID string, userType string, roleSync bool) error {
	query := `UPDATE team_users SET type = $1, role_sync = $2 WHERE user_id = $3 AND team_id = $4`

	_, err := q.ExecContext(ctx, query, userType, roleSync, userID, teamID)

	return err
}

func (q *TeamQueries) UpdateTeam(ctx context.Context, team models.Team) error {
	query := `UPDATE team SET name = $1, avatar_url = $2, url = $3, updated_at = $4 WHERE id = $5`

	team.UpdatedAt = utils.CurrentTime()

	_, err := q.ExecContext(ctx, query, team.Name, team.AvatarURL, team.URL, team.UpdatedAt, team.ID)

	return err
}

func (q *TeamQueries) UpdateTeamBilling(ctx context.Context, team models.Team) error {
	query := `UPDATE team SET customer_id = $1, subscription_id = $2, updated_at = $3 WHERE id = $4`

	team.UpdatedAt = utils.CurrentTime()

	_, err := q.ExecContext(ctx, query, team.CustomerID, team.SubscriptionID, team.UpdatedAt, team.ID)

	return err
}

func (q *TeamQueries) SetTeamSnapshotLimit(ctx context.Context, teamID string, limit int) error {
	query := `UPDATE team SET snapshot_limit = $1 WHERE id = $2`

	_, err := q.ExecContext(ctx, query, limit, teamID)

	return err
}
