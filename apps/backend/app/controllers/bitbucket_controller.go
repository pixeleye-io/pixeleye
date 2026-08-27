package controllers

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"os"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/app/git"
	git_bitbucket "github.com/pixeleye-io/pixeleye/app/git/bitbucket"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
)

const bitbucketOauthStateCookie = "pixeleye_bitbucket_oauth_state"

func bitbucketCallbackURL() string {
	return os.Getenv("BACKEND_URL") + "/v1/git/bitbucket/callback"
}

// BitbucketAuthorize kicks off the OAuth authorization-code flow for connecting a
// Bitbucket Cloud workspace to a Pixeleye team. There's no GitHub-App-style "installation"
// concept here, so the CSRF state is a random value round-tripped via a short-lived cookie
// rather than a stored DB row (which GitHub's personal-account-link flow ties to an
// existing Account, something we don't have yet at this point).
func BitbucketAuthorize(c echo.Context) error {
	if _, err := middleware.GetUser(c); err != nil {
		return err
	}

	stateBytes := make([]byte, 32)
	if _, err := rand.Read(stateBytes); err != nil {
		return err
	}
	state := hex.EncodeToString(stateBytes)

	c.SetCookie(&http.Cookie{
		Name:     bitbucketOauthStateCookie,
		Value:    state,
		Path:     "/v1/git/bitbucket",
		MaxAge:   600,
		HttpOnly: true,
		Secure:   strings.HasPrefix(os.Getenv("BACKEND_URL"), "https"),
		SameSite: http.SameSiteLaxMode,
	})

	return c.Redirect(http.StatusSeeOther, git_bitbucket.AuthorizeURL(state, bitbucketCallbackURL()))
}

// BitbucketCallback exchanges the authorization code, lists the workspaces the token can
// access, and links (or re-links) the corresponding Pixeleye team. If the token has access
// to more than one workspace we connect the first and let the user use the "connect
// another workspace" flow again to add the others — matching the one-installation-per-team
// shape the rest of the app expects.
func BitbucketCallback(c echo.Context) error {
	user, err := middleware.GetUser(c)
	if err != nil {
		return err
	}

	code := c.QueryParam("code")
	state := c.QueryParam("state")

	if code == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Code is required")
	}

	cookie, err := c.Cookie(bitbucketOauthStateCookie)
	if err != nil || cookie.Value == "" || cookie.Value != state {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid or missing state")
	}
	c.SetCookie(&http.Cookie{
		Name:     bitbucketOauthStateCookie,
		Value:    "",
		Path:     "/v1/git/bitbucket",
		MaxAge:   -1,
		HttpOnly: true,
	})

	tokens, err := git_bitbucket.ExchangeCodeForToken(c.Request().Context(), code, bitbucketCallbackURL())
	if err != nil {
		return err
	}

	tmpClient := git_bitbucket.NewTempClient(tokens.AccessToken)

	workspaces, err := tmpClient.GetWorkspaces(c.Request().Context())
	if err != nil {
		return err
	}

	if len(workspaces) == 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "No Bitbucket workspaces available to this account")
	}

	team, _, err := git_bitbucket.LinkBitbucketTeam(c.Request().Context(), user, workspaces[0], tokens)
	if err != nil {
		return err
	}

	if err := git.SyncTeamMembers(c.Request().Context(), team); err != nil {
		return err
	}

	return c.Redirect(http.StatusSeeOther, os.Getenv("FRONTEND_URL")+"/add/bitbucket?team="+team.ID)
}
