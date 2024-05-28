package payments

import (
	"os"

	"github.com/pixeleye-io/pixeleye/app/billing"
	"github.com/stripe/stripe-go/v78"
	"github.com/stripe/stripe-go/v78/client"
)

type PaymentClient struct {
	*billing.CustomerBilling
}

func NewPaymentClient() PaymentClient {

	stripeAPI := &client.API{}

	config := &stripe.BackendConfig{
		MaxNetworkRetries: stripe.Int64(3),
	}

	stripeAPI.Init(os.Getenv("STRIPE_ACCESS_TOKEN"), &stripe.Backends{
		API:     stripe.GetBackendWithConfig(stripe.APIBackend, config),
		Uploads: stripe.GetBackendWithConfig(stripe.UploadsBackend, config),
	})

	return PaymentClient{
		CustomerBilling: &billing.CustomerBilling{
			API: stripeAPI,
		},
	}
}
