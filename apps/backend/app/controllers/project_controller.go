package controllers

import (
	"net/http"

	"github.com/labstack/echo/v4"
	nanoid "github.com/matoous/go-nanoid/v2"
	"github.com/pixeleye-io/pixeleye/app/git"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/pixeleye-io/pixeleye/platform/database"
	"github.com/rs/zerolog/log"
	"golang.org/x/crypto/bcrypt"
)

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

	team, err := middleware.GetTeam(c)

	if err != nil {
		return err
	}

	if err := c.Bind(&project); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	project.Role = "admin"

	project.TeamID = team.ID // We want to override the team ID from the request body. Otherwise, a user could create a project for another team.

	user, err := middleware.GetUser(c)

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

	if err := git.SyncTeamMembers(c.Request().Context(), team); err != nil {
		// No need to fail this request if the team members could not be synced.
		log.Error().Err(err).Msgf("Failed to sync team members for team %s", team.ID)
	}

	return c.JSON(http.StatusCreated, project)
}

func GetProjectBuilds(c echo.Context) error {

	project := middleware.GetProject(c)

	db, err := database.OpenDBConnection()

	if err != nil {
		return err
	}

	branch := c.QueryParam("branch")

	builds, err := db.GetProjectBuilds(c.Request().Context(), project.ID, branch)

	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, builds)
}

func GetProject(c echo.Context) error {

	project := middleware.GetProject(c)

	// We should remove the token via the struct but we also remove it here for safety.
	project.Token = ""

	return c.JSON(http.StatusOK, project)
}

func RegenerateToken(c echo.Context) error {

	project := middleware.GetProject(c)

	token, err := generateToken()

	if err != nil {
		return err
	}

	hashedToken, err := hashToken(token)

	if err != nil {
		return err
	}

	project.Token = hashedToken

	db, err := database.OpenDBConnection()

	if err != nil {
		return err
	}

	if err := db.UpdateProject(project); err != nil {
		return err
	}

	project.RawToken = token

	return c.JSON(http.StatusOK, project)
}

type UpdateProjectRequest struct {
	Name string `json:"name" validate:"required"`
}

func DeleteProject(c echo.Context) error {

	project := middleware.GetProject(c)

	body := UpdateProjectRequest{}

	if err := c.Bind(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	if project.Name != body.Name {
		return echo.NewHTTPError(http.StatusBadRequest, "project name does not match")
	}

	db, err := database.OpenDBConnection()

	if err != nil {
		return err
	}

	if err := db.DeleteProject(project.ID); err != nil {
		return err
	}

	return c.NoContent(http.StatusNoContent)
}

type AddUserToProjectRequest struct {
	UserID string `json:"userID" validate:"required,nanoid"`
	Role   string `json:"role" validate:"required,oneof=admin reviewer viewer"`
}

func AddUserToProject(c echo.Context) error {

	project := middleware.GetProject(c)

	body := AddUserToProjectRequest{}

	if err := c.Bind(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	validator := utils.NewValidator()

	if err := validator.Struct(body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, utils.ValidatorErrors(err))
	}

	db, err := database.OpenDBConnection()

	if err != nil {
		return err
	}

	if err := db.AddUserToProject(project.TeamID, project.ID, body.UserID, body.Role); err != nil {
		// TODO - check if the error is a duplicate error and return a 409
		return err
	}

	return c.NoContent(http.StatusNoContent)
}

func RemoveUserFromProject(c echo.Context) error {

	userID := c.Param("user_id")

	project := middleware.GetProject(c)

	user, err := middleware.GetUser(c)

	if err != nil {
		return err
	}

	if userID == user.ID {
		return echo.NewHTTPError(http.StatusBadRequest, "you cannot remove yourself from the project")
	}

	db, err := database.OpenDBConnection()

	if err != nil {
		return err
	}

	if err := db.RemoveUserFromProject(project.ID, userID); err != nil {
		return err
	}

	return c.NoContent(http.StatusNoContent)
}

type UpdateProjectRoleRequest struct {
	Role string `json:"role" validate:"required,oneof=admin reviewer viewer"`
}

func UpdateProjectRole(c echo.Context) error {

	userID := c.Param("user_id")

	project := middleware.GetProject(c)

	body := UpdateProjectRoleRequest{}

	if err := c.Bind(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	validator := utils.NewValidator()

	if err := validator.Struct(body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, utils.ValidatorErrors(err))
	}

	db, err := database.OpenDBConnection()

	if err != nil {
		return err
	}

	if err := db.UpdateUserRoleOnProject(project.ID, userID, body.Role); err != nil {
		return err
	}

	return c.NoContent(http.StatusNoContent)
}
