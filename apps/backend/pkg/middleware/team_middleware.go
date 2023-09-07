package middleware

import (
	"fmt"
	"net/http"

	"golang.org/x/exp/slices" // TODO - upgrade to slices package when it's merged into the stdlib.

	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/pixeleye-io/pixeleye/platform/database"
	"github.com/rs/zerolog/log"
)

type PermissionsRequired struct {
	Roles []string
}

func NewPermissionsRequired(roles []string) *PermissionsRequired {
	return &PermissionsRequired{Roles: roles}
}

func getTeamKey(teamId string, userId string) string {
	return fmt.Sprintf("team:%s:user:%s", teamId, userId)
}

func GetTeam(c echo.Context) (models.Team, error) {
	teamID := c.Param("team_id")

	user, err := GetUser(c)

	if err != nil {
		return models.Team{}, err
	}

	team := c.Get(getTeamKey(teamID, user.ID))

	if team == nil {
		return models.Team{}, err
	}

	return team.(models.Team), nil
}

func (p *PermissionsRequired) TeamRoleAccess(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {

		// Get the team id from the context.
		teamID := c.Param("team_id")

		if !utils.ValidateNanoid(teamID) {
			return echo.NewHTTPError(http.StatusBadRequest, "invalid team ID")
		}

		user, err := GetUser(c)

		if err != nil {
			return err
		}

		log.Debug().Msgf("TeamRoleAccess: teamID: %s, userID: %s", teamID, user.ID)

		// Get the users role on the team.
		db, err := database.OpenDBConnection()
		if err != nil {
			return err
		}

		team, err := db.GetTeam(c.Request().Context(), teamID, user.ID)

		if err != nil {
			return err
		}

		log.Debug().Msgf("TeamRoleAccess: teamID: %s, userID: %s, role: %s, roles required: %v", teamID, user.ID, team.Role, p.Roles)

		if !slices.Contains(p.Roles, team.Role) {
			return echo.NewHTTPError(401, "you do not have permission to access this resource.")
		}

		c.Set(getTeamKey(teamID, user.ID), team)

		return next(c)
	}
}
