package middleware

import (
	// TODO - upgrade to slices package when it's merged into the stdlib.

	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/pixeleye-io/pixeleye/platform/database"
	"golang.org/x/exp/slices"
)

type ProjectPermissionsRequired struct {
	Roles     []string
	TeamRoles []string
}

func NewProjectPermissionsRequired(roles []string, teamRoles []string) *ProjectPermissionsRequired {
	return &ProjectPermissionsRequired{Roles: roles}
}

func (p *ProjectPermissionsRequired) ProjectRoleAccess(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {

		projectID := c.Param("project_id")

		if !utils.ValidateNanoid(projectID) {
			return echo.NewHTTPError(http.StatusBadRequest, "invalid project ID")
		}

		session := GetSession(c)

		user, err := utils.DestructureUser(session)

		if err != nil {
			return err
		}

		db, err := database.OpenDBConnection()

		if err != nil {
			return err
		}

		project, err := db.GetProjectAsUser(projectID, user.ID)

		if err != nil {
			return err
		}

		if !slices.Contains(p.Roles, project.Role) && !slices.Contains(p.TeamRoles, project.TeamRole) {
			return echo.NewHTTPError(401, "you do not have permission to access this resource.")
		}

		SetProject(c, &project)

		return next(c)
	}
}
