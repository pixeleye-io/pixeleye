package controllers

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
	nanoid "github.com/matoous/go-nanoid/v2"
	"github.com/pixeleye-io/pixeleye/app/git"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/app/queries"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/pixeleye-io/pixeleye/platform/database"
	"github.com/pixeleye-io/pixeleye/platform/email"
	"github.com/pixeleye-io/pixeleye/platform/storage"
	"github.com/rs/zerolog/log"
	"golang.org/x/crypto/bcrypt"
)

func generateToken() (string, error) {
	str, err := utils.GenerateRandomStringURLSafe(24)

	return "pxi__" + str, err
}

func hashToken(token string) (string, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(token), 8)
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

	if team.Type != models.TEAM_TYPE_USER && string(project.Source) != team.Type {
		return echo.NewHTTPError(http.StatusBadRequest, "non user teams can only create projects of the same type")
	}

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

	if err := db.CreateProject(c.Request().Context(), &project, user.ID); err != nil {
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

	branchStr := c.QueryParam("branch")
	limitStr := c.QueryParam("limit")
	offsetStr := c.QueryParam("offset")

	if limitStr == "" {
		limitStr = "25"
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "limit must be an integer")
	}

	if offsetStr == "" {
		offsetStr = "0"
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "offset must be an integer")
	}

	if limit > 128 {
		return echo.NewHTTPError(http.StatusBadRequest, "limit cannot be greater than 128")
	}

	builds, err := db.GetProjectBuilds(c.Request().Context(), project.ID, &queries.GetProjectBuildsOptions{
		Branch: branchStr, Limit: limit, Offset: offset,
	})
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

type updateProjectRequest struct {
	Name              string   `json:"name"`
	SnapshotThreshold *float64 `json:"snapshotThreshold" validate:"omitempty,min=0,max=1"`
	SnapshotBlur      *bool    `json:"snapshotBlur"`
	AutoApprove       string   `json:"autoApprove" validate:"omitempty"`
}

func UpdateProject(c echo.Context) error {

	project := middleware.GetProject(c)

	body := updateProjectRequest{}

	if err := c.Bind(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	validator := utils.NewValidator()

	if err := validator.Struct(body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, utils.ValidatorErrors(err))
	}

	if body.Name != "" {
		project.Name = body.Name
	}

	if body.SnapshotThreshold != nil {
		project.SnapshotThreshold = *body.SnapshotThreshold
	}

	if body.SnapshotBlur != nil {
		project.SnapshotBlur = *body.SnapshotBlur
	}

	if body.AutoApprove != "" {
		project.AutoApprove = body.AutoApprove
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	if err := db.UpdateProject(c.Request().Context(), project); err != nil {
		return err
	}

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

	if err := db.UpdateProject(c.Request().Context(), project); err != nil {
		return err
	}

	project.RawToken = token

	return c.JSON(http.StatusOK, project)
}

type DeleteProjectRequest struct {
	Name string `json:"name" validate:"required"`
}

func DeleteProject(c echo.Context) error {

	project := middleware.GetProject(c)

	body := DeleteProjectRequest{}

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

	s3, err := storage.GetClient()

	if err != nil {
		return err
	}

	log.Debug().Msgf("Deleting project %s from S3", project.ID)
	if err := s3.DeleteFolder(c.Request().Context(), os.Getenv("S3_BUCKET"), project.ID); err != nil {
		return err
	}

	return c.NoContent(http.StatusNoContent)
}

func GetProjectUsers(c echo.Context) error {
	project := middleware.GetProject(c)

	db, err := database.OpenDBConnection()

	if err != nil {
		return err
	}

	users, err := db.GetProjectUsers(c.Request().Context(), *project)

	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, users)
}

type AddUserToProjectRequest struct {
	Email        string `json:"email" validate:"required,email"`
	Role         string `json:"role" validate:"required,oneof=admin reviewer viewer"`
	DisableEmail bool   `json:"disableEmail"`
}

func AddUserToProject(c echo.Context) error {

	user, err := middleware.GetUser(c)
	if err != nil {
		return err
	}

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

	if userToInvite, err := db.GetUserByEmail(c.Request().Context(), body.Email); err == nil {
		if onProject, err := db.IsUserOnProject(c.Request().Context(), project.TeamID, userToInvite.ID); err != nil {
			return err
		} else if onProject {
			return echo.NewHTTPError(http.StatusConflict, "user is already on the project")
		}
	}

	invite, err := db.CreateProjectInvite(c.Request().Context(), project.ID, user.ID, body.Role, body.Email)
	if err != nil {
		return err
	}

	if !body.DisableEmail {

		emailBody := fmt.Sprintf(`Hi there,
	
	You've been invited to join a project on Pixeleye. Click the link below to accept the invitation.
	
	%s
	
	Thanks,
	
	Pixeleye Team`, os.Getenv("FRONTEND_URL")+"/invites/"+invite.ID)

		if err := email.SendEmail(body.Email, "Pixeleye project invite", emailBody); err != nil {
			return err
		}
	}

	return c.JSON(http.StatusCreated, invite)
}

func AcceptProjectInvite(c echo.Context) error {

	user, err := middleware.GetUser(c)
	if err != nil {
		return err
	}

	inviteID := c.Param("invite_code")
	if !utils.ValidateNanoid(inviteID) {
		return echo.NewHTTPError(http.StatusBadRequest, "invite code is invalid")
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	invite, err := db.GetProjectInvite(c.Request().Context(), inviteID)
	if err == sql.ErrNoRows || (err == nil && (invite.ExpiresAt.Before(time.Now())) || invite.Email != user.Email) {
		return echo.NewHTTPError(http.StatusNotFound, "invite expired or not found")
	} else if err != nil {
		return err
	}

	project, err := db.GetProject(c.Request().Context(), invite.ProjectID)
	if err != nil {
		return err
	}

	if onProject, err := db.IsUserOnProject(c.Request().Context(), project.TeamID, user.ID); err != nil {
		return err
	} else if onProject {
		return echo.NewHTTPError(http.StatusConflict, "user is already on the project")
	}

	if err := db.AddUserToProject(c.Request().Context(), project.TeamID, project.ID, user.ID, invite.Role); err != nil {
		return err
	}

	if err := db.DeleteProjectInvite(c.Request().Context(), invite.ID); err != nil {
		return err
	}

	project.Token = ""
	project.RawToken = ""

	return c.JSON(http.StatusCreated, project)
}

func GetProjectInvite(c echo.Context) error {

	user, err := middleware.GetUser(c)
	if err != nil {
		return err
	}

	inviteID := c.Param("invite_code")
	if !utils.ValidateNanoid(inviteID) {
		return echo.NewHTTPError(http.StatusBadRequest, "invite code is invalid")
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	invite, err := db.GetProjectInviteData(c.Request().Context(), inviteID)
	if err == sql.ErrNoRows || (err == nil && (invite.ExpiresAt.Before(time.Now()) || invite.Email != user.Email)) {
		return echo.NewHTTPError(http.StatusNotFound, "invite expired or not found")
	} else if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, invite)
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
	Role string `json:"role" validate:"omitempty,oneof=admin reviewer viewer"`
	Sync bool   `json:"sync"`
}

func UpdateUserOnProject(c echo.Context) error {

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

	if body.Role != "" && body.Sync {
		return echo.NewHTTPError(http.StatusBadRequest, "cannot sync and update role at the same time")
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	if body.Role != "" {
		if found, err := db.UpdateUserRoleOnProject(c.Request().Context(), project.ID, userID, body.Role, false); err != nil {
			return err
		} else if !found {
			return echo.NewHTTPError(http.StatusNotFound, "user not found on project")
		}
	} else if body.Sync {
		// We set the viewer as we're not sure what end role the user will get. This means the user won't be able to do anything until the sync is complete.
		if found, err := db.UpdateUserRoleOnProject(c.Request().Context(), project.ID, userID, models.PROJECT_MEMBER_ROLE_VIEWER, true); err != nil {
			return err
		} else if !found {
			return echo.NewHTTPError(http.StatusNotFound, "user not found on project")
		}

		team, err := db.GetTeam(c.Request().Context(), project.TeamID, userID)
		if err != nil {
			return err
		}

		if err := git.SyncProjectMembers(c.Request().Context(), team, *project); err != nil {
			return err
		}
	}

	return c.NoContent(http.StatusNoContent)
}
