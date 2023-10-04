package middleware

import (
	"net/http"

	"slices"

	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/pixeleye-io/pixeleye/platform/database"
	"github.com/rs/zerolog/log"
)

// TODO - fix middleware to return 404

type ProjectPermissionsRequired struct {
	Roles     []string
	TeamRoles []string
}

func NewProjectPermissionsRequired(roles []string, teamRoles []string) *ProjectPermissionsRequired {
	return &ProjectPermissionsRequired{Roles: roles, TeamRoles: teamRoles}
}

func (p *ProjectPermissionsRequired) ProjectRoleAccess(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {

		build, _ := GetBuild(c)

		var projectID string
		if build == nil {
			projectID = c.Param("project_id")
		} else {
			projectID = build.ProjectID
		}

		log.Debug().Msgf("project id: %s", projectID)

		if !utils.ValidateNanoid(projectID) {
			return echo.NewHTTPError(http.StatusBadRequest, "invalid project ID")
		}

		user, err := GetUser(c)
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

		log.Debug().Msgf("project: %+v", project)
		log.Debug().Msgf("roles: %+v", p.Roles)
		log.Debug().Msgf("team roles: %+v", p.TeamRoles)

		if !slices.Contains(p.Roles, project.Role) && !slices.Contains(p.TeamRoles, project.TeamRole) {
			return echo.NewHTTPError(401, "you do not have permission to access this resource.")
		}

		SetProject(c, &project)

		log.Debug().Msgf("project: %+v", project)

		return next(c)
	}
}
