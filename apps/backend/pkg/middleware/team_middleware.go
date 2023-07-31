package middleware

import (
	"fmt"
	"net/http"

	"golang.org/x/exp/slices" // TODO - upgrade to slices package when it's merged into the stdlib.

	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/pixeleye-io/pixeleye/platform/database"
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

func GetTeam(c echo.Context) models.Team {
	teamID := c.Param("team_id")
	userID := GetSession(c).GetId()
	return c.Get(getTeamKey(teamID, userID)).(models.Team)
}

func (p *PermissionsRequired) TeamRoleAccess(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {

		// Get the team id from the context.
		teamID := c.Param("team_id")

		if !utils.ValidateNanoid(teamID) {
			return echo.NewHTTPError(http.StatusBadRequest, "invalid team ID")
		}

		// Get the user from the context.
		user := GetSession(c)

		// Check if we already have the team in the context.
		// TODO - check this actually works.
		if team, ok := c.Get(getTeamKey(teamID, user.GetId())).(models.Team); ok {
			if !slices.Contains(p.Roles, team.Role) {
				return echo.NewHTTPError(401, "you do not have permission to access this resource.")
			}
			return next(c)
		}

		// Get the users role on the team.
		db, err := database.OpenDBConnection()
		if err != nil {
			return err
		}

		team := models.TeamMember{}

		if _, err := db.GetTeam(teamID, user.GetId()); err != nil {
			return err
		}

		if !slices.Contains(p.Roles, team.Role) {
			return echo.NewHTTPError(401, "you do not have permission to access this resource.")
		}

		c.Set(getTeamKey(teamID, user.GetId()), team)

		return next(c)
	}
}
