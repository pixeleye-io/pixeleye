package controllers

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"

	"github.com/mitchellh/mapstructure"
)

func GetAuthenticatedUser(c echo.Context) error {

	// Get user from session.
	session := middleware.GetSession(c)

	user := models.User{}

	err := mapstructure.Decode(session.Identity.GetTraits(), &user)

	if err != nil {
		return err
	}

	userID := session.Identity.GetId()

	user.ID = userID

	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, user)
}
