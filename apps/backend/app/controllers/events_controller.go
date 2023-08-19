package controllers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
	"github.com/pixeleye-io/pixeleye/platform/broker"
	"github.com/pixeleye-io/pixeleye/platform/brokerTypes"
	"github.com/rs/zerolog/log"
)

type (
	Text struct {
		Text string `json:"text"`
	}
)

type (
	Geolocation struct {
		Altitude  float64
		Latitude  float64
		Longitude float64
	}
)

var (
	locations = []Geolocation{
		{-97, 37.819929, -122.478255},
		{1899, 39.096849, -120.032351},
		{2619, 37.865101, -119.538329},
		{42, 33.812092, -117.918974},
		{15, 37.77493, -122.419416},
	}
)

func EventTest(c echo.Context) error {
	c.Response().Header().Set("Content-Type", "text/event-stream")
	c.Response().WriteHeader(http.StatusOK)

	// enc := json.NewEncoder(c.Response().Writer)

	// c.Response().Writer

	for _, _ = range locations {
		// if err := enc.Encode(l); err != nil {
		// 	return err
		// }
		_, err := fmt.Fprintf(c.Response().Writer, "data: %s\n\n", "Hello")
		if err != nil {
			log.Error().Err(err)
		}
		c.Response().Flush()
		time.Sleep(1 * time.Second)
	}
	return nil
}

// TODO - investigate if we should only have 1 subscriber and then broadcast to all clients
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

	quit := make(chan bool)

	// Subscribe to the channel
	err = broker.SubscribeToQueue(connection, project.ID, brokerTypes.ProjectUpdate, func(msg []byte) error {

		log.Debug().Msg("Received message from project events")

		if _, err := fmt.Fprintf(c.Response().Writer, "data: %s\n\n", string(msg)); err != nil {
			return err
		}

		c.Response().Flush()

		return nil
	}, quit)

	if err != nil {
		log.Error().Err(err)
		quit <- true
	}

	<-quit

	return nil
}
