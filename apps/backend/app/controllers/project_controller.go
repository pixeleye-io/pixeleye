package controllers

import (
	"fmt"
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/pixeleye-io/pixeleye/platform/database"
	"golang.org/x/crypto/bcrypt"
)

func generateToken() (string, error) {
	return utils.GenerateRandomStringURLSafe(32)
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

	if err := c.Bind(&project); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	validate := utils.NewValidator()

	project.ID = uuid.New()

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

	if err := db.CreateProject(&project); err != nil {
		return err
	}

	return c.JSON(http.StatusCreated, project)
}

func GetProject(c echo.Context) error {

	id, err := uuid.Parse(c.Param("id"))

	if err != nil {
		return err
	}

	db, err := database.OpenDBConnection()

	if err != nil {
		return err
	}

	project, err := db.GetProject(id)

	if err != nil {
		fmt.Println(err)
		return echo.NewHTTPError(http.StatusNotFound, "project with given ID not found")
	}

	// We should remove the token via the struct but we also remove it here for safety.
	// TODO - add test to ensure that the token is not returned.
	project.Token = ""

	return c.JSON(http.StatusOK, project)
}
