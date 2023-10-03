package controllers

import (
	"net/http"
	"strconv"

	"github.com/google/go-github/v55/github"
	"github.com/labstack/echo/v4"
	git_github "github.com/pixeleye-io/pixeleye/app/git/github"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
	"github.com/pixeleye-io/pixeleye/platform/database"
	"github.com/rs/zerolog/log"
)

func GetTeamProjects(c echo.Context) error {
	team, err := middleware.GetTeam(c)

	if err != nil {
		return err
	}

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

func GetTeamUsers(c echo.Context) error {
	team, err := middleware.GetTeam(c)

	if err != nil {
		return err
	}

	db, err := database.OpenDBConnection()

	if err != nil {
		return err
	}

	users, err := db.GetUsersOnTeam(c.Request().Context(), team.ID)

	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, users)
}

func GetRepos(c echo.Context) error {

	team, err := middleware.GetTeam(c)

	if err != nil {
		return err
	}

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

		allRepos := make([]models.GitRepo, 0)

		hasNext := true
		page := 0

		for hasNext {

			var repos *github.ListRepositories
			repos, hasNext, err = ghClient.GetInstallationRepositories(c.Request().Context(), page)

			page += 1

			if err != nil {
				return err
			}

			formattedRepos := make([]models.GitRepo, len(repos.Repositories))

			for i, repo := range repos.Repositories {
				formattedRepos[i] = models.GitRepo{
					ID:          strconv.FormatInt(repo.GetID(), 10),
					Name:        repo.Name,
					Private:     repo.Private,
					URL:         repo.HTMLURL,
					LastUpdated: repo.GetPushedAt().Time,
					Description: repo.Description,
				}
			}

			allRepos = append(allRepos, formattedRepos...)
		}

		return c.JSON(http.StatusOK, allRepos)

	}

	return c.String(http.StatusBadRequest, "Team type not supported")
}

func GetInstallations(c echo.Context) error {

	team, err := middleware.GetTeam(c)

	if err != nil {
		return err
	}

	db, err := database.OpenDBConnection()

	if err != nil {
		return err
	}

	installations, err := db.GetGitInstallations(c.Request().Context(), team.ID)

	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, installations)
}
