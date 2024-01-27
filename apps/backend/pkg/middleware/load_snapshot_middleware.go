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

func GetSnapshot(c echo.Context) (*models.Snapshot, error) {
	snapshot := c.Get("snapshot")

	if snapshot == nil {
		return nil, fmt.Errorf("Snapshot not found")
	}

	return snapshot.(*models.Snapshot), nil
}

func LoadSnapshot(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {

		snapshotID := c.Param("snap_id")

		if !utils.ValidateNanoid(snapshotID) {
			return echo.NewHTTPError(http.StatusBadRequest, "invalid snapshot ID")
		}

		db, err := database.OpenDBConnection()
		if err != nil {
			return err
		}

		snapshot, err := db.GetSnapshot(c.Request().Context(), snapshotID)
		if err != nil {
			log.Error().Err(err).Msg("error getting snapshot")
			return err
		}

		c.Set("snapshot", &snapshot)

		return next(c)
	}
}
