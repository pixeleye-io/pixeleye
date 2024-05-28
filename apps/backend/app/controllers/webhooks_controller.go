package controllers

import (
	"io"
	"net/http"
	"os"

	"github.com/labstack/echo/v4"
	"github.com/rs/zerolog/log"
	"github.com/stripe/stripe-go/v78/webhook"
)

func StripeWebhookController(c echo.Context) error {

	// Get the signature from the header.
	signature := c.Request().Header.Get("Stripe-Signature")

	// Get the raw body from the request.
	body := c.Request().Body

	payload, err := io.ReadAll(body)
	if err != nil {
		log.Error().Err(err).Msg("error reading body")
		return c.NoContent(http.StatusServiceUnavailable)
	}

	// Get the event from the request.
	event, err := webhook.ConstructEventWithOptions(payload, signature, os.Getenv("STRIPE_WEBHOOK_SECRET"), webhook.ConstructEventOptions{
		IgnoreAPIVersionMismatch: true,
	})
	if err != nil {
		return err
	}

	log.Debug().Msgf("event type: %s", event.Type)

	// Handle the event.
	switch event.Type {
	default:
		return c.NoContent(http.StatusOK)
	}
}
