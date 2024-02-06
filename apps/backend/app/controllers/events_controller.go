package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/app/events"
	"github.com/pixeleye-io/pixeleye/app/models"
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
		}, 1, quit)

		if err != nil {
			log.Error().Err(err)
		}
	}(quit)

	<-c.Request().Context().Done()

	quit <- true

	return nil
}

// This is accessible with a project token & we filter out any unrelated build messages
func SubscribeToBuild(c echo.Context) error {

	log.Info().Msg("Subscriber to build events")

	build, err := middleware.GetBuild(c)

	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to get build")
	}

	initial := c.QueryParam("initial")

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

	if initial == "true" {

		event := events.EventPayload{
			Type: events.ProjectEvent_BuildStatus,
			Data: events.BuildStatusBody{
				BuildID:   build.ID,
				Status:    build.Status,
				ProjectID: build.ProjectID,
			},
		}

		msg, err := json.Marshal(event)
		if err != nil {
			return err
		}

		if _, err := fmt.Fprintf(c.Response().Writer, "data: %s\n\n", msg); err != nil {
			return err
		}

		c.Response().Flush()

	}

	quit := make(chan bool)
	go func(quit chan bool, build *models.Build, res *echo.Response) {
		err = broker.SubscribeToQueue(connection, build.ProjectID, brokerTypes.ProjectUpdate, func(msg []byte) error {

			log.Debug().Msgf("Received message from project events:%s", msg)

			event := events.EventPayload{}

			if err := json.Unmarshal(msg, &event); err != nil {
				return err
			}

			if event.Type == events.ProjectEvent_BuildStatus {
				if event.Data.(map[string]interface{})["buildID"] == build.ID {
					log.Debug().Msgf("Sending message to build events subscribers:%s", msg)
					if _, err := fmt.Fprintf(res.Writer, "data: %s\n\n", msg); err != nil {
						return err
					}
					res.Flush()
				}
			}

			return nil
		}, 1, quit)

		if err != nil {
			log.Error().Err(err)
		}
	}(quit, build, c.Response())

	<-c.Request().Context().Done()

	quit <- true

	return nil
}
