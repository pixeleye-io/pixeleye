package middleware

import (
	"context"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/mitchellh/mapstructure"
	ory "github.com/ory/client-go"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/rs/zerolog/log"
)

type oryMiddleware struct {
	ory *ory.APIClient
}

func GetUserTraits(c echo.Context) (*models.UserTraits, error) {
	session := GetSession(c)

	userTraits := &models.UserTraits{}

	err := mapstructure.Decode(session.Identity.GetTraits(), &userTraits)

	if err != nil {
		return nil, err
	}

	return userTraits, nil
}

func GetSession(c echo.Context) *ory.Session {
	return c.Get("session").(*ory.Session)
}

func GetUser(c echo.Context) (models.User, error) {
	session := GetSession(c)

	return utils.DestructureUser(session)
}

func NewOryMiddleware() *oryMiddleware {
	cfg := ory.NewConfiguration()
	cfg.Servers = ory.ServerConfigurations{
		{
			URL: "http://localhost:4000/.ory", // Ory Network Project URL
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
		c.Set("session", session)
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

		resp, _, err := k.ory.FrontendApi.ToSession(context.Background()).XSessionToken(authorization).Execute()
		if err != nil {
			log.Err(err).Msg("Error validating session")
			return nil, err
		}
		return resp, nil
	}

	cookies := r.Header.Get("Cookie")

	resp, _, err := k.ory.FrontendApi.ToSession(context.Background()).Cookie(cookies).Execute()
	if err != nil {
		return nil, err
	}
	return resp, nil
}
