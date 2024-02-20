package middleware

import (
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/pixeleye-io/pixeleye/platform/database"
	"github.com/rs/zerolog/log"
)

func GetBuild(c echo.Context) (*models.Build, error) {
	build := c.Get("build")

	if build == nil {
		return nil, fmt.Errorf("build not found")
	}

	return build.(*models.Build), nil
}

func LoadBuild(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {

		buildID := c.Param("build_id")

		if buildID == "" {
			snapshot, err := GetSnapshot(c)
			if err != nil {
				return echo.NewHTTPError(http.StatusBadRequest, "invalid build ID")
			}

			buildID = snapshot.BuildID
		}

		if !utils.ValidateNanoid(buildID) {
			return echo.NewHTTPError(http.StatusBadRequest, "invalid build ID")
		}

		db, err := database.OpenDBConnection()
		if err != nil {
			return err
		}

		build, err := db.GetBuild(c.Request().Context(), buildID)
		if err != nil {
			log.Error().Err(err).Msg("error getting build")
			return err
		}

		c.Set("build", &build)

		return next(c)
	}
}
