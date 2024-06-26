package billing

import (
	"context"
	"fmt"
	"os"
	"strconv"
	"time"

	"slices"

	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/platform/database"
	"github.com/rs/zerolog/log"
	"github.com/stripe/stripe-go/v78"
	"github.com/stripe/stripe-go/v78/client"
)

type CustomerBilling struct {
	API *client.API
}

type CreateCustomerOpts struct {
	TeamID string
}

// If it's a user team we attach their email
func (c *CustomerBilling) CreateCustomer(opts CreateCustomerOpts) (*stripe.Customer, error) {
	params := &stripe.CustomerParams{
		Metadata: map[string]string{
			"teamID": opts.TeamID,
		},
	}

	customer, err := c.API.Customers.New(params)
	if err != nil {
		return nil, err
	}

	return customer, nil
}

func (c *CustomerBilling) GetOrCreateCustomer(ctx context.Context, team models.Team) (*stripe.Customer, error) {
	if team.CustomerID != "" {
		if customer, err := c.API.Customers.Get(team.CustomerID, nil); err != nil {
			if err.(*stripe.Error).Code != stripe.ErrorCodeResourceMissing {
				return nil, err
			}
		} else {
			return customer, nil
		}
	}

	customer, err := c.CreateCustomer(CreateCustomerOpts{
		TeamID: team.ID,
	})
	if err != nil {
		return nil, err
	}

	team.CustomerID = customer.ID

	db, err := database.OpenDBConnection()
	if err != nil {
		return nil, err
	}

	if err := db.UpdateTeamBilling(ctx, team); err != nil {
		return nil, err
	}

	return customer, nil
}

func (c *CustomerBilling) CreateBillingPortalSession(team models.Team) (*stripe.BillingPortalSession, error) {

	if team.CustomerID == "" {
		return nil, fmt.Errorf("team does not have a customer id")
	}

	var returnURL string
	if team.Type == models.TEAM_TYPE_USER {
		returnURL = os.Getenv("FRONTEND_URL") + "/billing"
	} else {
		returnURL = os.Getenv("FRONTEND_URL") + "/billing" + "?team=" + team.ID
	}

	params := &stripe.BillingPortalSessionParams{
		Customer:  stripe.String(team.CustomerID),
		ReturnURL: stripe.String(returnURL),
	}

	return c.API.BillingPortalSessions.New(params)
}

func (c *CustomerBilling) getLatestSubscription(ctx context.Context, team models.Team) (*stripe.Subscription, error) {
	if team.CustomerID == "" {
		return nil, fmt.Errorf("team does not have a customer id")
	}

	price := os.Getenv("STRIPE_PRICE_ID_5000")
	if team.Referrals == 1 {
		price = os.Getenv("STRIPE_PRICE_ID_6250")
	} else if team.Referrals == 2 {
		price = os.Getenv("STRIPE_PRICE_ID_7500")
	}

	list := c.API.Subscriptions.List(&stripe.SubscriptionListParams{
		Customer: stripe.String(team.CustomerID),
		Price:    stripe.String(price),
	})

	// We will only ever have 1 active subscription
	if list.Next() {
		return list.Subscription(), nil
	} else if list.Err() != nil {
		if list.Err().(*stripe.Error).Code == stripe.ErrorCodeResourceMissing && list.Err().(*stripe.Error).Param == "customer" {
			// Customer has been deleted in stripe, we should delete the customer id from the team
			team.CustomerID = ""
			team.SubscriptionID = ""

			db, err := database.OpenDBConnection()
			if err != nil {
				return nil, err
			}

			if err := db.UpdateTeamBilling(ctx, team); err != nil {
				return nil, err
			}
		} else {
			log.Error().Err(list.Err()).Msgf("error getting latest subscription: %s", list.Err().Error())
			return nil, nil
		}
	}

	list = c.API.Subscriptions.List(&stripe.SubscriptionListParams{
		Customer: stripe.String(team.CustomerID),
	})

	if list.Next() {
		sub := list.Subscription()

		if err := c.UpdateTeamPlan(ctx, team, sub); err != nil {
			return nil, err
		}

		return sub, nil
	}

	team.CustomerID = ""
	team.SubscriptionID = ""

	db, err := database.OpenDBConnection()
	if err != nil {
		return nil, err
	}

	if err := db.UpdateTeamBilling(ctx, team); err != nil {
		return nil, err
	}

	return nil, nil
}

func (c *CustomerBilling) CanCreateNewSubscription(team models.Team) (bool, int, error) {
	if team.CustomerID == "" {
		return true, 0, nil
	}

	list := c.API.Subscriptions.List(&stripe.SubscriptionListParams{
		Customer: &team.CustomerID,
	})

	// If we have a subscription, we can't create a new one
	if list.Next() {
		sub := list.Subscription()
		if sub.Status == stripe.SubscriptionStatusActive {
			return false, 1, nil
		} else if slices.Contains([]stripe.SubscriptionStatus{
			stripe.SubscriptionStatusIncomplete,
			stripe.SubscriptionStatusIncompleteExpired,
			stripe.SubscriptionStatusPastDue,
			stripe.SubscriptionStatusUnpaid,
		}, sub.Status) {
			return false, 2, nil
		}
	}

	return true, 0, nil
}

func (c *CustomerBilling) UpdateTeamPlan(ctx context.Context, team models.Team, sub *stripe.Subscription) error {
	price := os.Getenv("STRIPE_PRICE_ID_5000")
	if team.Referrals == 1 {
		price = os.Getenv("STRIPE_PRICE_ID_6250")
	} else if team.Referrals == 2 {
		price = os.Getenv("STRIPE_PRICE_ID_7500")
	}

	var err error
	if sub == nil {
		sub, err = c.GetCurrentSubscription(ctx, team)
		if err != nil {
			return err
		} else if sub == nil {
			return nil
		}
	}

	_, err = c.API.Subscriptions.Update(sub.ID, &stripe.SubscriptionParams{
		Items: []*stripe.SubscriptionItemsParams{
			{
				ID:    &sub.Items.Data[0].ID,
				Price: &price,
			},
		},
	})

	return err
}

func (c *CustomerBilling) GetCurrentSubscription(ctx context.Context, team models.Team) (*stripe.Subscription, error) {
	if team.CustomerID == "" {
		// If we don't have a customer id, we definitely don't have a subscription
		return nil, nil
	}

	var sub *stripe.Subscription

	if team.SubscriptionID == "" {
		var err error
		sub, err = c.getLatestSubscription(ctx, team)
		if err != nil {
			return nil, err
		}
	}

	// If we have a subscription id, we can just get the subscription
	if team.SubscriptionID != "" {
		var err error
		sub, err = c.API.Subscriptions.Get(team.SubscriptionID, nil)
		if err != nil {
			// If the subscription is not found, we should get the latest subscription instead
			if err.(*stripe.Error).Code == stripe.ErrorCodeResourceMissing {
				sub, err = c.getLatestSubscription(ctx, team)
				if err != nil {
					return nil, err
				}
			} else {
				return nil, err
			}
		} else if slices.Contains([]stripe.SubscriptionStatus{
			stripe.SubscriptionStatusCanceled,
			stripe.SubscriptionStatusIncompleteExpired,
			stripe.SubscriptionStatusUnpaid,
		}, sub.Status) {
			// If the subscription is in a state where it's not active, we should get the latest subscription to be sure we have the latest
			sub, err = c.getLatestSubscription(ctx, team)
			if err != nil {
				return nil, err
			}
		}
	}

	if sub != nil && team.SubscriptionID != sub.ID {
		team.SubscriptionID = sub.ID

		db, err := database.OpenDBConnection()
		if err != nil {
			return nil, err
		}

		if err := db.UpdateTeamBilling(ctx, team); err != nil {
			return nil, err
		}
	} else if sub == nil && team.SubscriptionID != "" {
		team.SubscriptionID = ""

		db, err := database.OpenDBConnection()
		if err != nil {
			return nil, err
		}

		if err := db.UpdateTeamBilling(ctx, team); err != nil {
			return nil, err
		}
	}

	return sub, nil
}

func (c *CustomerBilling) CreateCheckout(ctx context.Context, team models.Team) (
	*stripe.CheckoutSession, error) {

	customer, err := c.GetOrCreateCustomer(ctx, team)
	if err != nil {
		return nil, err
	}

	price := os.Getenv("STRIPE_PRICE_ID_5000")
	if team.Referrals == 1 {
		price = os.Getenv("STRIPE_PRICE_ID_6250")
	} else if team.Referrals == 2 {
		price = os.Getenv("STRIPE_PRICE_ID_7500")
	}
	return c.API.CheckoutSessions.New(&stripe.CheckoutSessionParams{
		SuccessURL:          stripe.String(os.Getenv("FRONTEND_URL") + "/billing"),
		CancelURL:           stripe.String(os.Getenv("FRONTEND_URL") + "/billing"),
		Mode:                stripe.String("subscription"),
		Customer:            stripe.String(customer.ID),
		AllowPromotionCodes: stripe.Bool(true),
		TaxIDCollection: &stripe.CheckoutSessionTaxIDCollectionParams{
			Enabled: stripe.Bool(true),
		},
		CustomerUpdate: &stripe.CheckoutSessionCustomerUpdateParams{
			Address:  stripe.String("auto"),
			Shipping: stripe.String("auto"),
			Name:     stripe.String("auto"),
		},
		AutomaticTax: &stripe.CheckoutSessionAutomaticTaxParams{
			Enabled: stripe.Bool(true),
		},
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price: stripe.String(price),
			},
		},
	})

}

func (c *CustomerBilling) ReportSnapshotUsage(customerID string, buildID string, snapshotCount int64) error {

	params := &stripe.BillingMeterEventParams{
		EventName: stripe.String("snapshots"),
		Payload: map[string]string{
			"stripe_customer_id": customerID,
			"value":              strconv.Itoa(int(snapshotCount)),
		},
		Timestamp:  stripe.Int64(time.Now().Unix()),
		Identifier: stripe.String(buildID),
	}

	_, err := c.API.BillingMeterEvents.New(params)

	return err
}
