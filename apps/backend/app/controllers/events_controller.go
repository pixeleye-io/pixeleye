package controllers

import (
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
	"github.com/pixeleye-io/pixeleye/platform/broker"
	"github.com/pixeleye-io/pixeleye/platform/brokerTypes"
	"github.com/rs/zerolog/log"
)

func SubscribeToProject(c echo.Context) error {

	log.Info().Msg("Subscriber to project events")

	project := middleware.GetProject(c)

	c.Response().Header().Set("Content-Type", "text/event-stream")
	c.Response().Header().Set("Cache-Control", "no-cache")
	c.Response().Header().Set("Connection", "keep-alive")

	c.Response().WriteHeader(http.StatusOK)

	connection, err := broker.GetConnection()

	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to get connection")
	}

	if _, err := fmt.Fprintf(c.Response().Writer, "data: \"connected\"\n\n"); err != nil {
		return err
	}

	c.Response().Flush()

	quit := make(chan bool)
	go func(quit chan bool) {
		err = broker.SubscribeToQueue(connection, project.ID, brokerTypes.ProjectUpdate, func(msg []byte) error {

			log.Debug().Msgf("Received message from project events:%s", msg)

			if _, err := fmt.Fprintf(c.Response().Writer, "data: %s\n\n", msg); err != nil {
				return err
			}
			c.Response().Flush()

			return nil
		}, quit)

		if err != nil {
			log.Error().Err(err)
		}
	}(quit)

	<-c.Request().Context().Done()

	quit <- true

	return nil
}
