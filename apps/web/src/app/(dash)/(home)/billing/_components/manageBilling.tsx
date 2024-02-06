"use client";

import { API, useTeam } from "@/libs";
import { CreditCardIcon } from "@heroicons/react/24/outline";
import { Team, Subscription } from "@pixeleye/api";
import { Button, Container, Link } from "@pixeleye/ui";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import NextLink from "next/link";

export function ManageBillingAccount(
    { team, subscription }: {
        team: Team;
        subscription?: Subscription;
    }
) {

    const router = useRouter()

    const manageBillingAccount = useMutation({
        mutationFn: () => API.get("/v1/teams/{teamID}/billing/portal", {
            params: {
                teamID: team!.id,
            },
        }),
        onSuccess: (data) => {
            router.push(data.billingPortalURL)
        }
    })

    const upgradeToPro = useMutation({
        mutationFn: () => API.post("/v1/teams/{teamID}/billing/subscribe", {
            params: {
                teamID: team!.id,
            },
        }),
        onSuccess: (data) => {
            router.push(data.checkoutURL)
        }
    })

    console.log(subscription)

    return (
        <>
            <Container className="max-w-5xl flex items-center flex-col mt-12">
                <div className="text-center">
                    {
                        subscription == undefined && (<>
                            <CreditCardIcon
                                className="mx-auto h-12 w-12 text-on-surface"
                            />
                            <h3 className="mt-2 text-sm font-semibold text-on-surface">Current plan: Free</h3>
                            <p className="mt-1 text-sm text-on-surface-variant">
                                You are currently using Pixeleye for free. This means you are limited to 5000 snapshots per month.
                            </p>
                            <Link href="https://pixeleye.io/pricing">
                                Pricing
                            </Link>
                            {
                                upgradeToPro.error && (
                                    <p className="py-2 text-error">
                                        {upgradeToPro.error.message}
                                    </p>
                                )}
                            <div className="mt-6 space-x-4">
                                <Button loading={upgradeToPro.isPending} onClick={() => upgradeToPro.mutate()}>
                                    Upgrade to Pro
                                </Button>
                                {team.customerID && (
                                    <Button variant="ghost" loading={manageBillingAccount.isPending} onClick={() => manageBillingAccount.mutate()}>
                                        Manage billing
                                    </Button>
                                )}
                            </div>
                        </>
                        )
                    }
                    {
                        Boolean(subscription) && (<>
                            <CreditCardIcon
                                className="mx-auto h-12 w-12 text-on-surface"
                            />
                            <h3 className="mt-2 text-sm font-semibold text-on-surface">Current plan: Pro {Boolean(subscription?.cancelAt) && (<span className="text-xs text-error">Canceled</span>)}</h3>
                            <p className="mt-1 text-sm text-on-surface-variant">
                                <span className="text-primary text-lg">Thank you for supporting open-source!</span> <br /> Pro tier gives you unlimited snapshots per month, with the first 5000 snapshots being free.
                            </p>
                            <div className="mt-6">

                                <Button loading={manageBillingAccount.isPending} onClick={() => manageBillingAccount.mutate()}>
                                    Manage account
                                </Button>
                            </div></>
                        )
                    }
                </div>
            </Container>

        </>
    )
}