package billing

import (
	"context"
	"fmt"
	"os"

	"slices"

	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/platform/database"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/client"
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
		return c.GetCustomer(team.CustomerID)
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

func (c *CustomerBilling) getLatestSubscription(team models.Team) (*stripe.Subscription, error) {
	if team.CustomerID == "" {
		return nil, fmt.Errorf("team does not have a customer id")
	}

	list := c.API.Subscriptions.List(&stripe.SubscriptionListParams{
		Customer: &team.CustomerID,
		Price:    stripe.String("price_1OgtrZJdnGhKgAvmAR1LX8fl"),
	})

	// We will only ever have 1 active subscription
	if list.Next() {
		return list.Subscription(), nil
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

func (c *CustomerBilling) GetCurrentSubscription(ctx context.Context, team models.Team) (*stripe.Subscription, error) {
	if team.CustomerID == "" {
		// If we don't have a customer id, we definitely don't have a subscription
		return nil, nil
	}

	var sub *stripe.Subscription

	if team.SubscriptionID == "" {
		var err error
		sub, err = c.getLatestSubscription(team)

		if err != nil {
			return nil, err
		}
	}

	// If we have a subscription id, we can just get the subscription
	if team.SubscriptionID != "" {
		var err error
		sub, err = c.API.Subscriptions.Get(team.SubscriptionID, nil)
		if err != nil {
			return nil, err
		}

		if slices.Contains([]stripe.SubscriptionStatus{
			stripe.SubscriptionStatusCanceled,
			stripe.SubscriptionStatusIncompleteExpired,
			stripe.SubscriptionStatusUnpaid,
		}, sub.Status) {
			// If the subscription is in a state where it's not active, we should get the latest subscription
			sub, err = c.getLatestSubscription(team)
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
	}

	return sub, nil
}

func (c *CustomerBilling) CreateCheckout(ctx context.Context, team models.Team) (
	*stripe.CheckoutSession, error) {

	customer, err := c.GetOrCreateCustomer(ctx, team)
	if err != nil {
		return nil, err
	}

	return c.API.CheckoutSessions.New(&stripe.CheckoutSessionParams{
		SuccessURL: stripe.String(os.Getenv("FRONTEND_URL") + "/billing"),
		CancelURL:  stripe.String(os.Getenv("FRONTEND_URL") + "/billing"),
		Mode:       stripe.String("subscription"),
		Customer:   stripe.String(customer.ID),
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
				Price: stripe.String("price_1OgtrZJdnGhKgAvmAR1LX8fl"),
			},
		},
	})

}

func (c *CustomerBilling) GetCustomer(customerID string) (*stripe.Customer, error) {
	return c.API.Customers.Get(customerID, nil)
}

func (c *CustomerBilling) ReportSnapshotUsage(subscriptionID string, buildID string, snapshotCount int64) error {

	params := &stripe.UsageRecordParams{
		Quantity:         stripe.Int64(snapshotCount),
		SubscriptionItem: stripe.String(subscriptionID),
		Action:           stripe.String("increment"),
	}

	params.SetIdempotencyKey(buildID)

	_, err := c.API.UsageRecords.New(params)

	return err
}
