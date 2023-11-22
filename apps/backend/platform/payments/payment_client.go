package payments

import (
	"os"

	"github.com/pixeleye-io/pixeleye/app/billing"
	"github.com/stripe/stripe-go/v76/client"
)

type PaymentClient struct {
	*billing.CustomerBilling
}

func NewPaymentClient() PaymentClient {

	stripe := &client.API{}
	stripe.Init(os.Getenv("STRIPE_ACCESS_TOKEN"), nil)

	return PaymentClient{
		CustomerBilling: &billing.CustomerBilling{
			API: stripe,
		},
	}
}
