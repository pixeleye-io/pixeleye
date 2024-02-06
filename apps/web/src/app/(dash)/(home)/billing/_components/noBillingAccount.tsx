"use client";

import { API, useTeam } from "@/libs";
import { CreditCardIcon } from "@heroicons/react/24/outline";
import { Team } from "@pixeleye/api";
import { Button, Container } from "@pixeleye/ui";
import { useMutation } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { useRouter } from 'next/navigation'
import { StripeElementsOptions, loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement } from "@stripe/react-stripe-js";
import NextLink from "next/link";

export function NoBillingAccount(
    {
        team
    }: {
        team: Team
    }
) {

    const router = useRouter()

    const { mutate: upgradeToPro, isPending } = useMutation({
        mutationFn: () => API.post("/v1/teams/{teamID}/billing/subscribe", {
            params: {
                teamID: team!.id,
            },
        }),
        onSuccess: (data) => {
            router.push(data.checkoutURL)
        }
    })

    return (
        <>
            <Container className="max-w-5xl flex items-center flex-col mt-12">
                <div className="text-center">
                    <CreditCardIcon
                        className="mx-auto h-12 w-12 text-on-surface"
                    />
                    <h3 className="mt-2 text-sm font-semibold text-on-surface">You&apos;re currently using Pixeleye for free</h3>
                    <p className="mt-1 text-sm text-on-surface-variant">
                        This means you are limited to 5000 snapshots per month.
                    </p>
                    <div className="mt-6">
                        <Button className="mt-8" onClick={() => upgradeToPro()} loading={isPending}>
                            Upgrade to Pro
                        </Button>
                    </div>
                </div>
            </Container>
        </>
    )
}