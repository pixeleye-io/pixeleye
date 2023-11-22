package billing

import (
	"fmt"
	"os"

	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/client"
)

type CustomerBilling struct {
	API *client.API
}

type CreateCustomerOpts struct {
	TeamID string
	Email  *string
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

func (c *CustomerBilling) SubscribeToPlan(team models.Team, planID string) (*stripe.Subscription, error) {
	if team.BillingAccountID == nil {
		return nil, fmt.Errorf("team does not have a customer id")
	}

	list := c.API.Subscriptions.List(&stripe.SubscriptionListParams{
		Customer: team.BillingAccountID,
	})

	// check if they have any subscriptions
	if list.Next() {
		return nil, fmt.Errorf("team already has a subscription")
	}

	return c.API.Subscriptions.New(&stripe.SubscriptionParams{
		Customer: team.BillingAccountID,
		Items: []*stripe.SubscriptionItemsParams{
			{
				Price: stripe.String(os.Getenv("STRIPE_PLAN_ID")),
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
