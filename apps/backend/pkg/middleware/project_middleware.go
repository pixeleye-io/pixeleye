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

type projectMiddleware struct {
	db *database.Queries
}

func GetProject(c echo.Context) *models.Project {
	return c.Get("project").(*models.Project)
}

func (k *projectMiddleware) validateToken(r *http.Request) (*models.Project, error) {

	// We first check if the session token is set in the header otherwise we use the cookie.

	authorization := r.Header.Get("Authorization")

	if authorization != "" {
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

	projectId, err := utils.ExpandUUID(values[0])

	if err != nil {
		return nil, err
	}

	project, err := k.db.GetProject(projectId)

	if err != nil {
		return nil, err
	}

	if (bcrypt.CompareHashAndPassword([]byte(project.Token), []byte(values[1]))) != nil {
		return nil, fmt.Errorf("authorization header is invalid")
	}

	return &project, nil
}

func NewProjectMiddleware() *projectMiddleware {
	db, err := database.OpenDBConnection()
	if err != nil {
		panic(err)
	}
	return &projectMiddleware{
		db: db,
	}
}

func (k *projectMiddleware) ProjectToken(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		project, err := k.validateToken(c.Request())
		if err != nil {
			return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
		}
		c.Set("project", project)
		return next(c)
	}
}
