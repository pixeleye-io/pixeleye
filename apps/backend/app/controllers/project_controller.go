package controllers

import (
	"net/http"

	"github.com/labstack/echo/v4"
	nanoid "github.com/matoous/go-nanoid/v2"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/pixeleye-io/pixeleye/platform/database"
	"golang.org/x/crypto/bcrypt"
)

// TODO - refactor these to fetch team & project from context.

func generateToken() (string, error) {
	return utils.GenerateRandomStringURLSafe(24)
}

func hashToken(token string) (string, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(token), 14)
	if err != nil {
		return "", err
	}

	return string(hashed), nil
}

func CreateProject(c echo.Context) error {

	project := models.Project{}

	team := middleware.GetTeam(c)

	if err := c.Bind(&project); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	project.Role = "admin"

	project.TeamID = team.ID // We want to override the team ID from the request body. Otherwise, a user could create a project for another team.

	session := middleware.GetSession(c)

	user, err := utils.DestructureUser(session)

	if err != nil {
		return err
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	validate := utils.NewValidator()

	id, err := nanoid.New()

	if err != nil {
		return err
	}

	project.ID = id

	token, err := generateToken()

	if err != nil {
		return err
	}

	hashedToken, err := hashToken(token)

	if err != nil {
		return err
	}

	project.Token = hashedToken

	if err := validate.Struct(project); err != nil {
		// Return, if some fields are not valid.
		return echo.NewHTTPError(http.StatusBadRequest, utils.ValidatorErrors(err))
	}

	if err := db.CreateProject(&project, user.ID); err != nil {
		return err
	}

	project.RawToken = token

	return c.JSON(http.StatusCreated, project)
}

func GetProject(c echo.Context) error {

	project := middleware.GetProject(c)

	// We should remove the token via the struct but we also remove it here for safety.
	// TODO - add test to ensure that the token is not returned.
	project.Token = ""

	return c.JSON(http.StatusOK, project)
}

func RegenerateToken(c echo.Context) error {
	id := c.Param("id")

	if !utils.ValidateNanoid(id) {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid project ID")
	}

	db, err := database.OpenDBConnection()

	if err != nil {
		return err
	}

	project, err := db.GetProject(id)

	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "project with given ID not found")
	}

	token, err := generateToken()

	if err != nil {
		return err
	}

	hashedToken, err := hashToken(token)

	if err != nil {
		return err
	}

	project.Token = hashedToken

	if err := db.UpdateProject(&project); err != nil {
		return err
	}

	project.RawToken = token

	return c.JSON(http.StatusOK, project)
}
