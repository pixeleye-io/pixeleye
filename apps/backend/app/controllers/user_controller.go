package controllers

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/app/jobs"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/pixeleye-io/pixeleye/platform/database"
	"github.com/pixeleye-io/pixeleye/platform/identity"
)

func GetAuthenticatedUser(c echo.Context) error {

	// Get user from session.
	user, err := middleware.GetUser(c)

	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, user)
}

type DeleteUserRequest struct {
	Email         string `json:"email" validate:"required"`
	SkipPurgatory bool   `json:"skip_purgatory"`
}

// Steps:
// 1. Check the user has supplied the correct email of their account.
// 2. Update user state in ory
// 3. If successful, create a new entry in the user_deletion_request table.
// 4. Create a cron job to delete the user after at least 30 days.
// 5. If a user try's to login after they have been marked for deletion, they should be redirected to a page that says their account has been marked for deletion (with countdown) and there is a button to cancel the deletion request.
func DeleteUser(c echo.Context) error {

	// TODO  - Make sure the user has to re-authenticate before they can delete their account.

	// Get user from session.
	user, err := middleware.GetUser(c)

	if err != nil {
		return err
	}

	db, err := database.OpenDBConnection()

	if err != nil {
		return err
	}

	teams, err := db.GetUsersTeams(c.Request().Context(), user.ID)

	if err != sql.ErrNoRows && err != nil {
		return err
	} else if err != sql.ErrNoRows {
		for _, team := range teams {
			if team.Role == models.TEAM_MEMBER_ROLE_OWNER {
				return echo.NewHTTPError(http.StatusBadRequest, "you cannot delete your account while you are the owner of a team.")
			}
		}
	}

	// Get the request body.
	deleteUserRequest := DeleteUserRequest{}

	if err := c.Bind(&deleteUserRequest); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	validator := utils.NewValidator()

	if err := validator.Struct(deleteUserRequest); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, utils.ValidatorErrors(err))
	}

	// Check the user has supplied the correct email of their account.
	if user.Email != deleteUserRequest.Email {
		return echo.NewHTTPError(http.StatusBadRequest, "Incorrect email.")
	}

	// Update user field in ory on behalf of user.
	if err = identity.SetState(user.ID, false); err != nil {
		return err
	}

	expirers := time.Now().AddDate(0, 1, 0)

	if deleteUserRequest.SkipPurgatory {
		expirers = time.Now()
	}

	err = db.CreateUserDeleteRequest(user.ID, expirers)

	if err != nil {
		return err
	}

	if deleteUserRequest.SkipPurgatory {
		jobs.DeleteUserJob()
	}

	return c.JSON(http.StatusOK, user)
}

func GetUsersTeams(c echo.Context) error {

	// Get user from session.
	user, err := middleware.GetUser(c)

	if err != nil {
		return err
	}

	db, err := database.OpenDBConnection()

	if err != nil {
		return err
	}

	teams, err := db.GetUsersTeams(c.Request().Context(), user.ID)

	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, teams)
}
