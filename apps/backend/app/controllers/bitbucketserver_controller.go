package controllers

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/app/git"
	git_bitbucketserver "github.com/pixeleye-io/pixeleye/app/git/bitbucketserver"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
)

type bitbucketServerConnectRequest struct {
	TeamName    string `json:"teamName" validate:"required"`
	BaseURL     string `json:"baseURL" validate:"required,url"`
	AccessToken string `json:"accessToken" validate:"required"`
}

// BitbucketServerConnect connects a self-hosted Bitbucket Server instance to a new
// Pixeleye team using a user-supplied HTTP access token. Unlike GitHub/Bitbucket Cloud
// there's no central OAuth App/consumer or redirect dance — the token is validated inline
// and stored directly.
func BitbucketServerConnect(c echo.Context) error {
	user, err := middleware.GetUser(c)
	if err != nil {
		return err
	}

	req := new(bitbucketServerConnectRequest)
	if err := c.Bind(req); err != nil {
		return err
	}

	client := git_bitbucketserver.NewClient(req.BaseURL, req.AccessToken)
	if err := client.ValidateToken(c.Request().Context()); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Unable to authenticate with the given base URL and access token")
	}

	team, installation, err := git_bitbucketserver.LinkBitbucketServerTeam(c.Request().Context(), user, req.TeamName, req.BaseURL, req.AccessToken)
	if err != nil {
		return err
	}

	if err := git.SyncTeamMembers(c.Request().Context(), team); err != nil {
		return err
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"team":         team,
		"installation": installation,
	})
}
