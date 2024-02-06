package billing

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"slices"

	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/platform/database"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/client"
)

// nolint:gochecknoglobals
var stripePlans []models.TeamPlan

type CustomerBilling struct {
	API *client.API
}

type CreateCustomerOpts struct {
	TeamID string
	Email  *string
}

// TODO - make this an api call to stripe so we can have 1 source of truth
func GetPlans() ([]models.TeamPlan, error) {
	if len(stripePlans) == 0 {
		plans := os.Getenv("STRIPE_PLANS")

		if err := json.Unmarshal([]byte(plans), &stripePlans); err != nil {
			return []models.TeamPlan{}, err
		}
	}

	return stripePlans, nil
}

// If it's a user team we attach their email
func (c *CustomerBilling) CreateCustomer(opts CreateCustomerOpts) (*stripe.Customer, error) {
	params := &stripe.CustomerParams{
		Email: opts.Email,
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

const (
	CUSTOMER_BILLING_FLOW_MANAGE_BILLING = "manage_billing"
	CUSTOMER_BILLING_FLOW_METHOD_UPDATE  = "method_update"
)

func resolveFlowData(flow string) *stripe.BillingPortalSessionFlowDataParams {
	switch flow {
	case CUSTOMER_BILLING_FLOW_MANAGE_BILLING:
		return &stripe.BillingPortalSessionFlowDataParams{}
	case CUSTOMER_BILLING_FLOW_METHOD_UPDATE:
		return &stripe.BillingPortalSessionFlowDataParams{
			Type: stripe.String("payment_method_update"),
		}
	default:
		return nil
	}
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

func (c *CustomerBilling) CreateBillingPortalSession(team models.Team, flow string) (*stripe.BillingPortalSession, error) {

	if team.CustomerID == "" {
		return nil, fmt.Errorf("team does not have a customer id")
	}

	flowData := resolveFlowData(flow)

	var returnURL string
	if team.Type == models.TEAM_TYPE_USER {
		returnURL = os.Getenv("FRONTEND_URL") + "/billing"
	} else {
		returnURL = os.Getenv("FRONTEND_URL") + "/billing" + "?team=" + team.ID
	}

	params := &stripe.BillingPortalSessionParams{
		Customer:  stripe.String(team.CustomerID),
		ReturnURL: stripe.String(returnURL),
		FlowData:  flowData,
	}

	return c.API.BillingPortalSessions.New(params)
}

func (c *CustomerBilling) getLatestSubscription(team models.Team) (*stripe.Subscription, error) {
	if team.CustomerID == "" {
		return nil, fmt.Errorf("team does not have a customer id")
	}

	list := c.API.Subscriptions.List(&stripe.SubscriptionListParams{
		Customer: &team.CustomerID,
		Price:    stripe.String("price_1OgnJIJdnGhKgAvmy3eHz8BV"),
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
				Price: stripe.String("price_1OgnJIJdnGhKgAvmy3eHz8BV"),
			},
		},
	})

}

func (c *CustomerBilling) GetCustomer(customerID string) (*stripe.Customer, error) {
	return c.API.Customers.Get(customerID, nil)
}

func (c *CustomerBilling) GetCustomerPaymentMethods(customerID string) ([]*stripe.PaymentMethod, error) {
	list := c.API.PaymentMethods.List(&stripe.PaymentMethodListParams{
		Customer: stripe.String(customerID),
		Type:     stripe.String("card"),
	})

	paymentMethods := []*stripe.PaymentMethod{}

	for list.Next() {
		paymentMethods = append(paymentMethods, list.PaymentMethod())
	}

	return paymentMethods, nil
}

func (c *CustomerBilling) ReportSnapshotUsage(team models.Team, buildID string, snapshotCount int64) error {

	params := &stripe.UsageRecordParams{
		Quantity:         stripe.Int64(snapshotCount),
		SubscriptionItem: stripe.String(team.SubscriptionID),
		Action:           stripe.String("increment"),
	}

	params.SetIdempotencyKey(buildID)

	_, err := c.API.UsageRecords.New(params)

	return err
}

func GetTeamBillingStatus(status stripe.SubscriptionStatus) string {
	switch status {
	case stripe.SubscriptionStatusActive:
		return models.TEAM_BILLING_STATUS_ACTIVE
	case stripe.SubscriptionStatusPastDue:
		return models.TEAM_BILLING_STATUS_PAST_DUE
	case stripe.SubscriptionStatusUnpaid:
		return models.TEAM_BILLING_STATUS_UNPAID
	case stripe.SubscriptionStatusCanceled:
		return models.TEAM_BILLING_STATUS_CANCELED
	case stripe.SubscriptionStatusIncomplete:
		return models.TEAM_BILLING_STATUS_INCOMPLETE
	case stripe.SubscriptionStatusIncompleteExpired:
		return models.TEAM_BILLING_STATUS_INCOMPLETE_EXPIRED
	default:
		return models.TEAM_BILLING_STATUS_CANCELED
	}
}

func (c *CustomerBilling) CreateSetupIntent(ctx context.Context, team models.Team) (*stripe.SetupIntent, error) {

	customer, err := c.GetOrCreateCustomer(ctx, team)
	if err != nil {
		return nil, err
	}

	params := &stripe.SetupIntentParams{
		Customer:           stripe.String(customer.ID),
		Description:        stripe.String("Setup payment details for team"),
		PaymentMethodTypes: []*string{stripe.String("card")},
		Usage:              stripe.String("off_session"),
		UseStripeSDK:       stripe.Bool(true),
	}

	return c.API.SetupIntents.New(params)
}
