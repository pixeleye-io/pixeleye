package middleware

import (
	"database/sql"
	"errors"
	"net/http"
	"net/url"
	"os"

	"github.com/labstack/echo/v4"
	"github.com/lib/pq"
	"github.com/mitchellh/mapstructure"
	ory "github.com/ory/client-go"
	"github.com/pixeleye-io/pixeleye/app/git"
	git_github "github.com/pixeleye-io/pixeleye/app/git/github"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/platform/database"
	"github.com/rs/zerolog/log"
)

type oryMiddleware struct {
	ory *ory.APIClient
}

func destructureUserTraits(traits interface{}) (*models.UserTraits, error) {
	userTraits := &models.UserTraits{}

	err := mapstructure.Decode(traits, &userTraits)

	if err != nil {
		return nil, err
	}

	return userTraits, nil
}

func GetUser(c echo.Context) (models.User, error) {

	user := c.Get("user").(*models.User)

	if user == nil {
		return models.User{}, errors.New("user not found")
	}

	return *user, nil
}

func NewOryMiddleware() *oryMiddleware {
	cfg := ory.NewConfiguration()
	cfg.Servers = ory.ServerConfigurations{
		{
			URL: os.Getenv("ORY_URL"),
		},
	}

	return &oryMiddleware{
		ory: ory.NewAPIClient(cfg),
	}
}
func (k *oryMiddleware) Session(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		session, err := k.validateSession(c.Request())
		if err != nil || !*session.Active {
			return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
		}

		db, err := database.OpenDBConnection()
		if err != nil {
			log.Err(err).Msg("Error opening database connection")
			return err
		}

		user, err := db.GetUserByAuthID(c.Request().Context(), session.Identity.GetId())
		if err != nil && err != sql.ErrNoRows {
			log.Err(err).Msg("Error getting user")
			return err
		}

		if err == sql.ErrNoRows {
			userTraits, err := destructureUserTraits(session.Identity.GetTraits())

			if err != nil {
				log.Err(err).Msg("Error destructuring user traits")
				return err
			}

			user, err = db.CreateUser(c.Request().Context(), session.Identity.GetId(), *userTraits)
			if driverErr, ok := err.(*pq.Error); ok && driverErr.Code == pq.ErrorCode("23505") {
				log.Error().Err(err).Msg("Error creating user, user already exists")
				user, err = db.GetUserByAuthID(c.Request().Context(), session.Identity.GetId())
				if err != nil {
					log.Error().Err(err).Msg("Error creating user")
					return err
				}

			} else if err != nil {
				log.Err(err).Msg("Error creating user")
				return err
			}

			if err := git.SyncUserTeamsAndAccount(c.Request().Context(), user); err != nil && err != sql.ErrNoRows && err != git_github.ExpiredRefreshTokenError {
				return err
			} else if err == git_github.ExpiredRefreshTokenError {
				// Our refresh token has expired, redirect the user to github to re-authenticate.
				return git_github.RedirectGithubUserToLogin(c, user)
			}
		}

		c.Set("user", &user)
		return next(c)
	}
}
func (k *oryMiddleware) validateSession(r *http.Request) (*ory.Session, error) {

	// We first check if the session token is set in the header otherwise we use the cookie.

	authorization := r.Header.Get("Authorization")

	if authorization != "" {

		if len(authorization) < 7 {
			return nil, echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
		}
		tokenType := authorization[:6]

		if tokenType != "Bearer" && tokenType != "bearer" {
			return nil, echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
		}

		authorization = authorization[7:]

		resp, _, err := k.ory.FrontendAPI.ToSession(r.Context()).XSessionToken(authorization).Execute()
		if err != nil {
			log.Err(err).Msg("Error validating session")
			return nil, err
		}
		return resp, nil
	}

	cookies := r.Header.Get("Cookie")

	decoded, err := url.QueryUnescape(cookies)
	if err != nil {
		return nil, err
	}

	resp, _, err := k.ory.FrontendAPI.ToSession(r.Context()).Cookie(decoded).Execute()
	if err != nil {
		return nil, err
	}
	return resp, nil
}
