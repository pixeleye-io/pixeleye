"use client";

import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { useTheme } from "next-themes";
import { AddressElement, Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Button } from "@pixeleye/ui";
import { FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";

const stripePromise = loadStripe('pk_test_51NpwLbJdnGhKgAvmIsdsYFypNnR83qwo4YGUoseUWDZe43KyTcVgePZKTeBlQT4xq8GNRXgqr1xqhsXfH2BhpwB3000AsHIB3F');


export function Payment({
    teamID,
    clientSecret,
}: {
    teamID: string;
    clientSecret: string;
}) {


    const theme = useTheme();


    const options: StripeElementsOptions = {
        // passing the client secret obtained from the server
        clientSecret,
        appearance: {
            theme: theme.resolvedTheme === "dark" ? "night" : "stripe",
        },
    };



    return (
        <Elements stripe={stripePromise} options={options}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 my-12">
                <PaymentForm teamID={teamID} />
            </div>
        </Elements>
    )

}

function PaymentForm({
    teamID
}: {
    teamID: string;
}) {


    const stripe = useStripe();
    const elements = useElements();




    const handleSubmit = async (event: FormEvent) => {
        // We don't want to let default form submission happen here,
        // which would refresh the page.
        event.preventDefault();

        if (!stripe || !elements) {
            // Stripe.js hasn't yet loaded.
            // Make sure to disable form submission until Stripe.js has loaded.
            return;
        }

        const result = await stripe.confirmSetup({
            //`Elements` instance that was used to create the Payment Element
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/billing/subscribed?team=${teamID}`,
            },
        });


        if (result.error) {
            // Show error to your customer (for example, payment details incomplete)
            console.log(result.error.message);
        } else {
            // Your customer will be redirected to your `return_url`. For some payment
            // methods like iDEAL, your customer will be redirected to an intermediate
            // site first to authorize the payment, then redirected to the `return_url`.
        }
    };

    const submit = useMutation({
        mutationFn: handleSubmit
    })



    return (
        <form className="mx-auto max-w-3xl" onSubmit={submit.mutate}>
            <p className="mb-2">
                We won&apos;t charge you until you&apos;ve gone beyond our free limit.
            </p>
            <PaymentElement />
            <AddressElement options={{
                mode: "billing"
            }} />
            <div className="flex items-end">

                <Button loading={submit.isPending} className="mt-8 ml-auto">
                    Subscribe
                </Button>
            </div>

        </form>
    )

}