package controllers

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/platform/database"
)

func GetTeamsProjects(c echo.Context) error {
	// TODO - once we have the concept of teams, ensure we actually scope the projects to the team.
	// TODO - add pagination.
	db, err := database.OpenDBConnection()

	if err != nil {
		return err
	}

	projects, err := db.GetProjects()

	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, projects)
}
