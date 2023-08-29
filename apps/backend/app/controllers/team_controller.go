package controllers

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	git_github "github.com/pixeleye-io/pixeleye/app/git/github"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/pixeleye-io/pixeleye/platform/database"
	"github.com/rs/zerolog/log"
)

func GetTeamsProjects(c echo.Context) error {
	team := middleware.GetTeam(c)
	user, err := middleware.GetUser(c)

	if err != nil {
		return err
	}

	db, err := database.OpenDBConnection()

	if err != nil {
		return err
	}

	projects, err := db.GetTeamsProjectsAsUser(team.ID, user.ID)

	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, projects)
}

func GetRepos(c echo.Context) error {
	page := c.QueryParam("page")

	if page == "" {
		page = "0"
	}

	pageInt, err := strconv.Atoi(page)

	if err != nil {
		return err
	}

	team := middleware.GetTeam(c)

	db, err := database.OpenDBConnection()

	if err != nil {
		return err
	}

	installation, err := db.GetTeamInstallation(c.Request().Context(), team.ID)

	if err != nil {
		return err
	}

	log.Debug().Msgf("Installation: %+v", installation)

	if installation.Type == models.TEAM_TYPE_GITHUB {

		ghClient, err := git_github.NewGithubInstallClient(installation.InstallationID)

		if err != nil {
			return err
		}

		repos, err := ghClient.GetInstallationRepositories(c.Request().Context(), pageInt)

		if err != nil {
			return err
		}

		formattedRepos := make([]models.GitRepo, len(repos))

		for i, repo := range repos {
			formattedRepos[i] = models.GitRepo{
				ID:          strconv.FormatInt(utils.SafeDeref(repo.ID), 10),
				Name:        repo.Name,
				Private:     repo.Private,
				URL:         repo.URL,
				LastUpdated: repo.UpdatedAt.Time,
				Description: repo.Description,
			}
		}

		return c.JSON(http.StatusOK, formattedRepos)

	}

	return c.String(http.StatusBadRequest, "Team type not supported")
}
