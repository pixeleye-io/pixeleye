package controllers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"time"

	"github.com/google/go-github/v56/github"
	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/app/git"
	git_github "github.com/pixeleye-io/pixeleye/app/git/github"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
	"github.com/pixeleye-io/pixeleye/platform/database"
	"github.com/rs/zerolog/log"
)

func GithubAppInstallation(c echo.Context) error {
	installationID := c.QueryParam("installation_id")

	if installationID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Installation ID is required")
	}

	log.Info().Msgf("Github App Installation ID: %s", installationID)

	type response struct {
		Installation models.GitInstallation `json:"installation"`
		Team         models.Team            `json:"team"`
	}

	user, err := middleware.GetUser(c)
	if err != nil {
		return err
	}

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

	var team models.Team
	if git_github.IsUserInstallation(*app) {
		team, installation, err = git_github.LinkPersonalGithubTeam(c.Request().Context(), user, installationID)
		if err != nil {
			return err
		}
	} else if git_github.IsOrgInstallation(*app) {
		team, installation, err = git_github.LinkOrgGithubTeam(c.Request().Context(), user, app, installationID)
		if err != nil {
			return err
		}
		if err := git.SyncTeamMembers(c.Request().Context(), team); err != nil {
			return err
		}
	} else {
		return echo.NewHTTPError(http.StatusBadRequest, "Unknown owner type")
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
	clientID := os.Getenv("GITHUB_APP_CLIENT_ID")
	clientSecret := os.Getenv("GITHUB_APP_CLIENT_SECRET")
	redirectURL := os.Getenv("SERVER_ENDPOINT") + "/v1/git/github/callback"

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

	requestURL := fmt.Sprintf("https://github.com/login/oauth/access_token?client_id=%s&client_secret=%s&code=%s&redirect_uri=%s", clientID, clientSecret, code, url.QueryEscape(redirectURL))

	log.Debug().Msgf("Github Access Token Request URL: %s", requestURL)

	req, err := http.NewRequest("POST", requestURL, nil)
	if err != nil {
		return err
	}

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

	log.Debug().Msgf("Github Access Token Response: %s", respBody)

	var githubAccessToken githubAccessTokenResponse
	if err := json.Unmarshal(respBody, &githubAccessToken); err != nil {
		return err
	}

	if githubAccessToken.AccessToken == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Access token is required")
	}

	ghClient := github.NewClient(nil).WithAuthToken(githubAccessToken.AccessToken)
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

	// Sync user and teams
	if err := git.SyncUserTeamsAndAccount(c.Request().Context(), user); err != nil && err != sql.ErrNoRows && err != git_github.ExpiredRefreshTokenError {
		return err
	} else if err == git_github.ExpiredRefreshTokenError {
		// Our refresh token has expired, redirect the user to github to re-authenticate.
		return git_github.RedirectGithubUserToLogin(c, user)
	}

	// TODO - should add a custom redirect URL here
	return c.Redirect(http.StatusSeeOther, os.Getenv("NEXT_PUBLIC_SERVER_URL")+"/dashboard")
}
