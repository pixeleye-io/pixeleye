package controllers

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
	"github.com/pixeleye-io/pixeleye/platform/database"
)

func GetTeamsProjects(c echo.Context) error {
	team := middleware.GetTeam(c)
	user := middleware.GetSession(c)

	db, err := database.OpenDBConnection()

	if err != nil {
		return err
	}

	projects, err := db.GetTeamsProjectsAsUser(team.ID, user.GetId())

	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, projects)
}
