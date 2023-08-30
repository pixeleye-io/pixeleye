package Team_queries

import (
	"context"

	nanoid "github.com/matoous/go-nanoid/v2"

	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
)

func (q *TeamQueriesTx) CreateTeam(ctx context.Context, team *models.Team, creatorID string) error {
	createTeamQuery := `INSERT INTO team (id, name, type, avatar_url, url, created_at, updated_at, owner_id, external_id) VALUES (:id, :name, :type, :avatar_url, :url, :created_at, :updated_at, :owner_id, :external_id)`
	createUserOnTeamQuery := `INSERT INTO team_users (team_id, user_id, role) VALUES (:team_id, :user_id, :role)`

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

	userOnTeam := models.TeamMember{
		TeamID: team.ID,
		UserID: creatorID,
		Role:   models.TEAM_MEMBER_ROLE_OWNER,
	}

	if _, err = q.NamedExecContext(ctx, createUserOnTeamQuery, userOnTeam); err != nil {
		return err
	}

	return nil
}
