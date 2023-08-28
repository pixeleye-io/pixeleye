package controllers

import (
	"net/http"
	"strconv"

	"github.com/bradleyfalzon/ghinstallation/v2"
	"github.com/google/go-github/github"
	"github.com/labstack/echo/v4"
	github_queries "github.com/pixeleye-io/pixeleye/app/queries/github"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/pixeleye-io/pixeleye/platform/database"
	"github.com/rs/zerolog/log"
)

func GithubAppInstallation(c echo.Context) error {

	installationID := c.Param("installation_id")

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

	installation, err := db.GetGithubAppInstallation(installationID)

	if err != nil {
		return err
	}

	if installation.ID == "" {
		// Installation does not exist, we create it

		appID, err := utils.GetEnvInt("GITHUB_APP_ID")
		if err != nil {
			return err
		}

		key, err := utils.GetEnvStr("GITHUB_PRIVATE_KEY")
		if err != nil {
			return err
		}

		installationIDInt, err := strconv.Atoi(installationID)

		if err != nil {
			return err
		}

		itr, err := ghinstallation.New(http.DefaultTransport, int64(appID), int64(installationIDInt), []byte(key))

		if err != nil {
			return err
		}

		client := github.NewClient(&http.Client{Transport: itr})

		app, _, err := client.Apps.Get(c.Request().Context(), "")

		if err != nil {
			return err
		}

		if *app.Owner.Type == "User" {
			// TODO - Link to user
		} else if *app.Owner.Type == "Organization" {
			// TODO - Create/Link to organization
		} else {
			return echo.NewHTTPError(http.StatusBadRequest, "Unknown owner type")
		}

		tx, err := github_queries.NewGithubTx(db.GithubQueries.DB, c.Request().Context())

		if err != nil {
			return err
		}

		defer tx.Rollback()

		installation, err = tx.CreateGithubAppInstallation(c.Request().Context(), installationID)
	}

	return nil
}
