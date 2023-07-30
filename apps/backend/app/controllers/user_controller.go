package controllers

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/pixeleye-io/pixeleye/platform/database"
)

func GetAuthenticatedUser(c echo.Context) error {

	// Get user from session.
	session := middleware.GetSession(c)

	user, err := utils.DestructureUser(session)

	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, user)
}

func DeleteUser(c echo.Context) error {

	// TODO - we want to block users from deleting their own account if they are the owner of any teams.

	// TODO - update ory to add a user_deleted field. This must be a privileged field.
	// TODO  - if user needs re-authentication then go ahead and do that.
	// TODO - create an admin api to undelete users if within 30 days.

	// Steps:
	// 1. Get user from session.
	// 2. Check the user has supplied the correct name of their account.
	// 3. Update user field in ory on behalf of user.
	// 4. If successful, create a new entry in the user_deletion_request table.
	// 5. Create a cron job to delete the user after at least 30 days. (Might just run a weekly cron job to delete all users that have been marked for deletion.)
	// 6. If a user try's to login after they have been marked for deletion, they should be redirected to a page that says their account has been marked for deletion (show countdown) and there is a button to cancel the deletion request.

	// Get user from session.
	session := middleware.GetSession(c)

	user, err := utils.DestructureUser(session)

	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, user)
}

func GetPersonalTeam(c echo.Context) error {

	// Get user from session.
	session := middleware.GetSession(c)

	user, err := utils.DestructureUser(session)

	if err != nil {
		return err
	}

	db, err := database.OpenDBConnection()

	if err != nil {
		return err
	}

	team, err := db.GetUsersPersonalTeam(user.ID)

	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, team)
}

func GetUsersTeams(c echo.Context) error {

	// Get user from session.
	session := middleware.GetSession(c)

	user, err := utils.DestructureUser(session)

	if err != nil {
		return err
	}

	db, err := database.OpenDBConnection()

	if err != nil {
		return err
	}

	teams, err := db.GetUsersTeams(user.ID)

	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, teams)
}
