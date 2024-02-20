package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/pixeleye-io/pixeleye/platform/database"
	"golang.org/x/crypto/bcrypt"
)

func GetProject(c echo.Context) *models.Project {
	return c.Get("project").(*models.Project)
}

func SetProject(c echo.Context, project *models.Project) {
	c.Set("project", project)
}

func validateToken(r *http.Request) (*models.Project, error) {

	db, err := database.OpenDBConnection()
	if err != nil {
		return nil, err
	}

	// We first check if the session token is set in the header otherwise we use the cookie.

	authorization := r.Header.Get("Authorization")

	if authorization == "" {
		return nil, fmt.Errorf("authorization header is not set")
	}

	token := authorization[7:]

	if token == "" {
		return nil, fmt.Errorf("authorization header is invalid")
	}

	values := strings.Split(token, ":")

	if len(values) != 2 {
		return nil, fmt.Errorf("authorization header is invalid")
	}

	projectId := values[1]

	if !utils.ValidateNanoid(projectId) {
		return nil, fmt.Errorf("authorization header is invalid")
	}

	project, err := db.GetProjectWithTeamStatus(r.Context(), projectId)
	if err != nil {
		return nil, err
	}

	if (bcrypt.CompareHashAndPassword([]byte(project.Token), []byte(values[0]))) != nil {
		return nil, fmt.Errorf("authorization header is invalid")
	}

	if project.TeamStatus == models.TEAM_STATUS_SUSPENDED {
		return nil, fmt.Errorf("team is currently suspended")
	}

	return project.Project, nil
}

func ProjectTokenMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		project, err := validateToken(c.Request())
		if err != nil {
			return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
		}
		SetProject(c, project)
		return next(c)
	}
}
