package controllers

import (
	"io"
	"net/http"
	"os"

	"github.com/labstack/echo/v4"
	"github.com/rs/zerolog/log"
	"github.com/stripe/stripe-go/v76/webhook"
)

// func updateTeamSubscriptionStatus(ctx context.Context, subscription stripe.Subscription) error {

// 	log.Debug().Msgf("subscription status: %s", subscription.Status)
// 	log.Debug().Msgf("subscription customer id: %s", subscription.Customer.ID)

// 	db, err := database.OpenDBConnection()
// 	if err != nil {
// 		return err
// 	}

// 	status := ""

// 	switch subscription.Status {
// 	case "active":
// 		status = models.TEAM_BILLING_STATUS_ACTIVE
// 	case "canceled":
// 		status = models.TEAM_BILLING_STATUS_CANCELED
// 	case "incomplete":
// 		status = models.TEAM_BILLING_STATUS_INCOMPLETE
// 	case "incomplete_expired":
// 		status = models.TEAM_BILLING_STATUS_INCOMPLETE_EXPIRED
// 	case "past_due":
// 		status = models.TEAM_BILLING_STATUS_PAST_DUE
// 	case "unpaid":
// 		status = models.TEAM_BILLING_STATUS_UNPAID
// 	}

// 	return db.UpdateTeamBillingStatus(ctx, subscription.Customer.ID, status)
// }

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
	// case "customer.subscription.created":
	// 	fallthrough
	// case "customer.subscription.deleted":
	// 	fallthrough
	// case "customer.subscription.paused":
	// 	fallthrough
	// case "customer.subscription.pending_update_applied":
	// 	fallthrough
	// case "customer.subscription.pending_update_expired":
	// 	fallthrough
	// case "customer.subscription.resumed":
	// 	fallthrough
	// case "customer.subscription.trial_will_end":
	// 	fallthrough
	// case "customer.subscription.updated":
	// 	{
	// 		sub := stripe.Subscription{}

	// 		if err := json.Unmarshal(event.Data.Raw, &sub); err != nil {
	// 			log.Error().Err(err).Msg("error unmarshalling subscription")
	// 			return c.NoContent(http.StatusServiceUnavailable)
	// 		}

	// 		if err := updateTeamSubscriptionStatus(c.Request().Context(), sub); err != nil {
	// 			log.Error().Err(err).Msg("error updating subscription status")
	// 			return c.NoContent(http.StatusServiceUnavailable)
	// 		}
	// 	}
	default:
		return c.NoContent(http.StatusOK)
	}

	return c.NoContent(http.StatusOK)
}
