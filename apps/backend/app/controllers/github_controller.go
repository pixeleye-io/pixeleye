package controllers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/google/go-github/v56/github"
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

func GithubAccountCallback(c echo.Context) error {

	user, err := middleware.GetUser(c)
	if err != nil {
		return err
	}

	code := c.QueryParam("code")
	state := c.QueryParam("state")
	clientID := os.Getenv("GITHUB_CLIENT_ID")
	clientSecret := os.Getenv("GITHUB_CLIENT_SECRET")
	redirectURL := os.Getenv("NEXT_PUBLIC_SERVER_URL") + "/dashboard"

	if code == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Code is required")
	}
	if state == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "State is required")
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	// Check if the state exists in the database
	accountState, err := db.GetOauthState(c.Request().Context(), state)
	if err != nil {
		return err
	}

	userAccount, err := db.GetAccount(c.Request().Context(), accountState.AccountID)
	if err != nil && err != sql.ErrNoRows {
		return err
	} else if err == sql.ErrNoRows {
		// We can't create an account here. Instead the user should first link their github account to their pixeleye account
		// We do it this way around so we can store the record in Kratos

		return echo.NewHTTPError(http.StatusBadRequest, "Github account is not linked to a pixeleye account, please link your github account to your pixeleye account first")
	}

	requestURL := "https://github.com/login/oauth/access_token"

	req, err := http.NewRequest("POST", requestURL, nil)

	if err != nil {
		return err
	}

	q := req.URL.Query()
	q.Add("client_id", clientID)
	q.Add("client_secret", clientSecret)
	q.Add("code", code)
	q.Add("redirect_uri", redirectURL)
	req.URL.RawQuery = q.Encode()

	req.Header.Add("Accept", "application/json")

	client := &http.Client{}

	resp, err := client.Do(req)
	if err != nil {
		return err
	}

	defer resp.Body.Close()

	type githubAccessTokenResponse struct {
		AccessToken           string `json:"access_token"`
		ExpiresIn             int    `json:"expires_in"`
		RefreshToken          string `json:"refresh_token"`
		RefreshTokenExpiresIn int    `json:"refresh_token_expires_in"`
		Scope                 string `json:"scope"`
		TokenType             string `json:"token_type"`
	}

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	var githubAccessToken githubAccessTokenResponse
	if err := json.Unmarshal(respBody, &githubAccessToken); err != nil {
		return err
	}

	if githubAccessToken.AccessToken == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Access token is required")
	}

	ghClient, err := git_github.NewGithubAppClient()
	if err != nil {
		return err
	}

	ghUser, _, err := ghClient.Users.Get(c.Request().Context(), "")
	if err != nil {
		return err
	}

	// We want to ensure this callback is for the correct user
	if fmt.Sprint(ghUser.GetID()) != userAccount.ProviderAccountID {
		return echo.NewHTTPError(http.StatusBadRequest, "Github account is not linked to the pixeleye account")
	}

	userAccount.AccessToken = githubAccessToken.AccessToken
	userAccount.RefreshToken = githubAccessToken.RefreshToken
	userAccount.AccessTokenExpiresAt = time.Now().Add(time.Second * time.Duration(githubAccessToken.ExpiresIn))
	userAccount.RefreshTokenExpiresAt = time.Now().Add(time.Second * time.Duration(githubAccessToken.RefreshTokenExpiresIn))

	if err = db.UpdateAccount(c.Request().Context(), &userAccount); err != nil {
		return err
	}

	// Sync user teams

	teams, err := db.GetUsersTeams(c.Request().Context(), user.ID)
	if err != nil && err != sql.ErrNoRows {
		log.Err(err).Msg("Error getting user teams")
		return err
	}

	if err := git_github.SyncUsersTeams(c.Request().Context(), user.ID, teams); err != nil && err != sql.ErrNoRows && err != git_github.ExpiredRefreshTokenError {
		log.Err(err).Msg("Error syncing user teams")
	} else if err == git_github.ExpiredRefreshTokenError {
		// Our refresh token has expired, redirect the user to github to re-authenticate.
		return git_github.RedirectGithubUserToLogin(c, user)
	}

	return c.NoContent(http.StatusOK)
}
