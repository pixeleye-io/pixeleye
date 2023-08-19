package controllers

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
	"github.com/pixeleye-io/pixeleye/platform/broker"
	"github.com/pixeleye-io/pixeleye/platform/brokerTypes"
	"github.com/rs/zerolog/log"
)

// TODO - investigate if we should only have 1 subscriber and then broadcast to all clients
func SubscribeToProject(c echo.Context) error {

	log.Info().Msg("Subscriber to project events")

	project := middleware.GetProject(c)

	flusher, ok := c.Response().Writer.(http.Flusher)

	if !ok {
		return echo.NewHTTPError(http.StatusInternalServerError, "Streaming unsupported!")
	}

	c.Response().Header().Set("Content-Type", "text/event-stream")
	c.Response().Header().Set("Cache-Control", "no-cache")
	c.Response().Header().Set("Connection", "keep-alive")
	// c.Response().Header().Set("Access-Control-Allow-Origin", "localhost:4000")
	c.Response().Header().Set("X-Accel-Buffering", "no")

	connection, err := broker.GetConnection()

	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to get connection")
	}

	_, err = c.Response().Write([]byte("{data: 'Connected'}"))
	if err != nil {
		return err
	}

	// Flush the data immediatly instead of buffering it for later.
	flusher.Flush()

	quit := make(chan bool)

	go func(quit chan bool) {

		// Subscribe to the channel
		err = broker.SubscribeToQueue(connection, project.ID, brokerTypes.ProjectUpdate, func(msg []byte) error {

			log.Debug().Msg("Received message from project events")

			// Write to the ResponseWriter
			_, err := c.Response().Write(msg)
			if err != nil {
				return err
			}

			// Flush the data immediatly instead of buffering it for later.
			flusher.Flush()

			return nil
		}, quit)

		if err != nil {
			log.Error().Err(err)
			quit <- true
		}
	}(quit)

	<-quit

	return nil
}
