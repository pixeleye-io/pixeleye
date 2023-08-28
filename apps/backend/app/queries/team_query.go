package queries

import (
	"context"
	"time"

	"github.com/jmoiron/sqlx"
	nanoid "github.com/matoous/go-nanoid/v2"
	"github.com/pixeleye-io/pixeleye/app/models"
)

type TeamQueries struct {
	*sqlx.DB
}

func (q *TeamQueries) CreateTeam(ownerId string, teamType string, teamName string) (models.Team, error) {
	createUserTeamQuery := `INSERT INTO team (id, name, type, avatar_url, url, created_at, updated_at, owner_id) VALUES (:id, :name, :type, :avatar_url, :url, :created_at, :updated_at, :owner_id)`
	createUserOnTeamQuery := `INSERT INTO team_users (team_id, user_id, role) VALUES (:team_id, :user_id, :role)`

	timeNow := time.Now()

	id, err := nanoid.New()

	if err != nil {
		return models.Team{}, err
	}

	team := models.Team{
		ID:        id,
		Type:      teamType,
		Name:      teamName,
		CreatedAt: timeNow,
		UpdatedAt: timeNow,
		Role:      models.TEAM_MEMBER_ROLE_OWNER,
	}

	if teamType == models.TEAM_TYPE_USER {
		// This ensures that the a user can only ever have one personal team.
		// They can own as many other teams as they want.
		team.OwnerID = ownerId
	}

	ctx := context.Background()

	tx, err := q.BeginTxx(ctx, nil)

	if err != nil {
		return team, err
	}

	// nolint:errcheck
	defer tx.Rollback()

	if _, err = tx.NamedExecContext(ctx, createUserTeamQuery, team); err != nil {
		return team, err
	}

	userOnTeam := models.TeamMember{
		TeamID: team.ID,
		UserID: ownerId,
		Role:   models.TEAM_MEMBER_ROLE_OWNER,
	}

	if _, err = tx.NamedExecContext(ctx, createUserOnTeamQuery, userOnTeam); err != nil {
		return team, err
	}

	return team, tx.Commit()
}
