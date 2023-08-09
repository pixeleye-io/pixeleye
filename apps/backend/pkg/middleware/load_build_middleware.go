package middleware

import (
	// TODO - upgrade to slices package when it's merged into the stdlib.

	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/pixeleye-io/pixeleye/platform/database"
	"github.com/rs/zerolog/log"
)

func GetBuild(c echo.Context) *models.Build {
	build := c.Get("build")
	if build == nil {
		return nil
	}
	return build.(*models.Build)
}

func SetBuild(c echo.Context, build *models.Build) {
	c.Set("build", build)
}

func LoadBuild(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {

		buildID := c.Param("build_id")

		log.Debug().Msgf("build id: %s", buildID)

		if !utils.ValidateNanoid(buildID) {
			return echo.NewHTTPError(http.StatusBadRequest, "invalid build ID")
		}

		db, err := database.OpenDBConnection()

		if err != nil {
			return err
		}

		build, err := db.GetBuild(buildID)

		if err != nil {
			log.Error().Err(err).Msg("error getting build")
			return err
		}

		SetBuild(c, &build)

		return next(c)
	}
}
