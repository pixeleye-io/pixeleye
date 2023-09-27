package controllers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/google/go-github/v55/github"
	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/app/git"
	git_github "github.com/pixeleye-io/pixeleye/app/git/github"
	"github.com/pixeleye-io/pixeleye/app/models"
	github_queries "github.com/pixeleye-io/pixeleye/app/queries/github"
	team_queries "github.com/pixeleye-io/pixeleye/app/queries/team"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
	"github.com/pixeleye-io/pixeleye/platform/database"
	"github.com/rs/zerolog/log"
)

func linkUserInstallation(c echo.Context, ghClient *git_github.GithubAppClient, installationID string) (models.GitInstallation, error) {

	user, err := middleware.GetUser(c)

	if err != nil {
		return models.GitInstallation{}, err
	}

	db, err := database.OpenDBConnection()

	if err != nil {
		return models.GitInstallation{}, err
	}

	tx, err := github_queries.NewGithubTx(db.GithubQueries.DB, c.Request().Context())

	if err != nil {
		return models.GitInstallation{}, err
	}

	// nolint:errcheck
	defer tx.Rollback()

	// TODO - add check that the currently signed in user also has our github app linked to their account

	personalTeam, err := db.GetUsersPersonalTeam(c.Request().Context(), user.ID)

	if err != nil {
		return models.GitInstallation{}, err
	}

	log.Debug().Msgf("Personal Team: %+v", personalTeam)

	installation, err := tx.CreateGithubAppInstallation(c.Request().Context(), installationID, personalTeam.ID)
	if err != nil {
		return models.GitInstallation{}, err
	}

	return installation, tx.Commit()
}

func linkOrgInstallation(c echo.Context, ghClient *git_github.GithubAppClient, app *github.Installation, installationID string) (models.GitInstallation, error) {

	db, err := database.OpenDBConnection()

	if err != nil {
		return models.GitInstallation{}, err
	}

	tx, err := github_queries.NewGithubTx(db.GithubQueries.DB, c.Request().Context())

	if err != nil {
		return models.GitInstallation{}, err
	}

	// nolint:errcheck
	defer tx.Rollback()

	team, err := db.GetTeamFromExternalID(c.Request().Context(), strconv.Itoa(int(*app.Account.ID)))

	if err == sql.ErrNoRows {
		// Team does not exist, we create it

		user, err := middleware.GetUser(c)

		if err != nil {
			return models.GitInstallation{}, err
		}

		ttx := team_queries.TeamQueriesTx{
			Tx: tx.Tx,
		}

		log.Debug().Msgf("App: %+v", app)

		team = models.Team{
			Type:       models.TEAM_TYPE_GITHUB,
			Name:       app.Account.GetLogin(),
			URL:        app.Account.GetOrganizationsURL(),
			AvatarURL:  app.Account.GetHTMLURL(),
			Role:       models.TEAM_MEMBER_ROLE_OWNER,
			ExternalID: strconv.Itoa(int(app.Account.GetID())),
		}

		err = ttx.CreateTeam(c.Request().Context(), &team, user.ID)
		if err != nil {
			return models.GitInstallation{}, err
		}

	} else if err != nil {
		return models.GitInstallation{}, err
	}

	existingInstallation, err := tx.GetGithubAPpInstallationByTeamIDForUpdate(c.Request().Context(), team.ID)

	if err != nil && err != sql.ErrNoRows {
		return models.GitInstallation{}, err
	}

	if err != sql.ErrNoRows {
		// Installation already exists, we can update it

		existingInstallation.InstallationID = installationID

		err := tx.UpdateGithubAppInstallation(c.Request().Context(), &existingInstallation)

		if err != nil {
			return models.GitInstallation{}, err
		}

		if err := tx.Commit(); err != nil {
			return existingInstallation, err
		}

		return existingInstallation, git.SyncTeamMembers(c.Request().Context(), team)
	}

	log.Debug().Msgf("Team: %+v", team)

	installation, err := tx.CreateGithubAppInstallation(c.Request().Context(), installationID, team.ID)

	if err != nil {
		return installation, err
	}

	log.Debug().Msgf("Created Github App Installation: %+v", installation)

	if err := tx.Commit(); err != nil {
		return installation, err
	}

	return installation, git.SyncTeamMembers(c.Request().Context(), team)
}

func GithubAppInstallation(c echo.Context) error {

	type response struct {
		Installation models.GitInstallation `json:"installation"`
		Team         models.Team            `json:"team"`
	}

	installationID := c.QueryParam("installation_id")

	if installationID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Installation ID is required")
	}

	log.Info().Msgf("Github App Installation ID: %s", installationID)

	// First we check if the installation exists in the database
	// If it does not exist, we create it

	db, err := database.OpenDBConnection()

	if err != nil {
		return err
	}

	installation, err := db.GetGitInstallationByID(c.Request().Context(), installationID, models.GIT_TYPE_GITHUB)

	if err != nil && err != sql.ErrNoRows {
		return err
	}

	if installation.ID != "" {

		user, err := middleware.GetUser(c)

		if err != nil {
			return err
		}

		team, err := db.GetTeam(c.Request().Context(), installation.TeamID, user.ID)

		if err != nil {
			return err
		}

		if err := git.SyncTeamMembers(c.Request().Context(), team); err != nil {
			return err
		}

		return echo.NewHTTPError(http.StatusOK, response{
			Installation: installation,
			Team:         team,
		})
	}

	ghClient, err := git_github.NewGithubAppClient()

	if err != nil {
		return err
	}

	app, err := ghClient.GetInstallationInfo(c.Request().Context(), installationID)

	if err != nil {
		return err
	}

	if git_github.IsUserInstallation(*app) {
		installation, err = linkUserInstallation(c, ghClient, installationID)
		if err != nil {
			return err
		}
	} else if git_github.IsOrgInstallation(*app) {
		installation, err = linkOrgInstallation(c, ghClient, app, installationID)
		if err != nil {
			return err
		}
	} else {
		return echo.NewHTTPError(http.StatusBadRequest, "Unknown owner type")
	}

	user, err := middleware.GetUser(c)

	if err != nil {
		return err
	}

	team, err := db.GetTeam(c.Request().Context(), installation.TeamID, user.ID)

	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, response{
		Installation: installation,
		Team:         team,
	})
}
