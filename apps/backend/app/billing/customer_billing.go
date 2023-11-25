package billing

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/pixeleye-io/pixeleye/app/models"
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

func (c *CustomerBilling) CreateBillingPortalSession(team models.Team, flow string) (*stripe.BillingPortalSession, error) {

	if team.BillingAccountID == nil {
		return nil, fmt.Errorf("team does not have a customer id")
	}

	flowData := resolveFlowData(flow)

	var returnURL string
	if team.Type == models.TEAM_TYPE_USER {
		returnURL = os.Getenv("NEXT_PUBLIC_SERVER_URL") + "/billing"
	} else {
		returnURL = os.Getenv("NEXT_PUBLIC_SERVER_URL") + "/billing" + "?team=" + team.ID
	}

	params := &stripe.BillingPortalSessionParams{
		Customer:  team.BillingAccountID,
		ReturnURL: stripe.String(returnURL),
		FlowData:  flowData,
	}

	return c.API.BillingPortalSessions.New(params)
}

func (c *CustomerBilling) SubscribeToPlan(team models.Team) (*stripe.Subscription, *models.TeamPlan, error) {
	if team.BillingAccountID == nil {
		return nil, nil, fmt.Errorf("team does not have a customer id")
	}

	list := c.API.Subscriptions.List(&stripe.SubscriptionListParams{
		Customer: team.BillingAccountID,
	})

	// check if they have any subscriptions
	if list.Next() {
		return nil, nil, fmt.Errorf("team already has a subscription")
	}

	// Check if they have any outstanding payments

	params := &stripe.InvoiceSearchParams{
		SearchParams: stripe.SearchParams{Query: "(status:\"open\" OR status:\"uncollectible\") AND customer:" + *team.BillingAccountID},
	}
	invoices := c.API.Invoices.Search(params)

	if invoices.Next() {
		invoices.Invoice()
		return nil, nil, fmt.Errorf("team has an outstanding payment")
	}

	plans, err := GetPlans()
	if err != nil {
		return nil, nil, err
	}

	var defaultPlan *models.TeamPlan
	for _, plan := range plans {
		if plan.Default {
			defaultPlan = &plan
			break
		}
	}

	sub, err := c.API.Subscriptions.New(&stripe.SubscriptionParams{
		Customer: team.BillingAccountID,
		AutomaticTax: &stripe.SubscriptionAutomaticTaxParams{
			Enabled: stripe.Bool(true),
		},

		Items: []*stripe.SubscriptionItemsParams{
			{
				Price: stripe.String(defaultPlan.PricingID),
			},
		},
	})

	return sub, defaultPlan, err
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
		SubscriptionItem: team.BillingSubscriptionItemID,
		Action:           stripe.String("increment"),
	}

	params.SetIdempotencyKey(buildID)

	_, err := c.API.UsageRecords.New(params)

	return err
}

func (c *CustomerBilling) GetCurrentSubscription(team models.Team) (*stripe.Subscription, error) {
	if team.BillingSubscriptionID == nil {
		return nil, fmt.Errorf("team does not have a subscription id")
	}

	return c.API.Subscriptions.Get(*team.BillingSubscriptionID, nil)
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
