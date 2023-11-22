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
                            <h3 className="mt-2 text-sm font-semibold text-on-surface">Current plan: Free tier</h3>
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
                            <h3 className="mt-2 text-sm font-semibold text-on-surface">Current plan: Free tier (canceled Pro tier)</h3>
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