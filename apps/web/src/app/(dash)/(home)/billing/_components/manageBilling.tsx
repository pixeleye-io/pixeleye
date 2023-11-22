"use client";

import { API, useTeam } from "@/libs";
import { CreditCardIcon } from "@heroicons/react/24/outline";
import { Team } from "@pixeleye/api";
import { Button, Container } from "@pixeleye/ui";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export function ManageBillingAccount(
    { team }: {
        team: Team
    }
) {

    const router = useRouter()

    const manageBillingAccount = useMutation({
        mutationFn: () => API.get("/teams/{teamID}/billing/portal", {
            params: {
                teamID: team!.id,
            },
        }),
        onSuccess: (data) => {
            router.push(data.billingPortalURL)
        }
    })

    const upgradeToPro = useMutation({
        mutationFn: () => API.post("/teams/{teamID}/billing/plan", {
            params: {
                teamID: team!.id,
            },
        }),
        onSuccess: (data) => {
            router.push(data.billingPortalURL)
        }
    })

    return (
        <>
            <Container className="max-w-5xl flex items-center flex-col mt-12">
                <div className="text-center">
                    {
                        team.billingStatus == "inactive" && (<>
                            <CreditCardIcon
                                className="mx-auto h-12 w-12 text-on-surface"
                            />
                            <h3 className="mt-2 text-sm font-semibold text-on-surface">Current plan: Free</h3>
                            <p className="mt-1 text-sm text-on-surface-variant">
                                You are currently using Pixeleye for free. This means you are limited to 5000 snapshots per month.
                            </p>
                            <div className="mt-6">

                                <Button loading={upgradeToPro.isPending} onClick={() => upgradeToPro.mutate()}>
                                    Upgrade to Pro
                                </Button>
                            </div></>
                        )
                    }
                    {
                        team.billingStatus == "canceled" && (<>
                            <CreditCardIcon
                                className="mx-auto h-12 w-12 text-on-surface"
                            />
                            <h3 className="mt-2 text-sm font-semibold text-on-surface">Current plan: Free tier (canceled Pro)</h3>
                            <p className="mt-1 text-sm text-on-surface-variant">
                                You are currently using Pixeleye for free. This means you are limited to 5000 snapshots per month. To upgrade to Pro, click the button below and reactivate your subscription.
                            </p>
                            <div className="mt-6">

                                <Button loading={manageBillingAccount.isPending} onClick={() => manageBillingAccount.mutate()}>
                                    Manage account
                                </Button>
                            </div></>
                        )
                    }
                    {
                        team.billingStatus == "past_due" && (<>
                            <CreditCardIcon
                                className="mx-auto h-12 w-12 text-on-surface"
                            />
                            <h3 className="mt-2 text-sm font-semibold text-on-surface">Current plan: Free (<span className="text-error">Overdue</span>)</h3>
                            <p className="mt-1 text-sm text-on-surface-variant">
                                You&apos;re currently overdue on your subscription. Please update your payment information to continue using Pixeleye.
                            </p>
                            <div className="mt-6">

                                <Button loading={manageBillingAccount.isPending} onClick={() => upgradeToPro.mutate()}>
                                    Manage account
                                </Button>
                            </div></>
                        )
                    }
                    {
                        team.billingStatus == "active" && (<>
                            <CreditCardIcon
                                className="mx-auto h-12 w-12 text-on-surface"
                            />
                            <h3 className="mt-2 text-sm font-semibold text-on-surface">Current plan: Pro</h3>
                            <p className="mt-1 text-sm text-on-surface-variant">
                                <span className="text-tertiary">Thank you for supporting open-source!</span> <br/> Pro tier gives you unlimited snapshots per month, with the first 5000 snapshots being free.
                            </p>
                            <div className="mt-6">

                                <Button loading={manageBillingAccount.isPending} onClick={() => upgradeToPro.mutate()}>
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

// : (<div className="mt-6 space-x-4">
// <Button loading={manageBillingAccount.isPending} onClick={() => manageBillingAccount.mutate()}>
//     Manage billing
// </Button>
// </div>
// )