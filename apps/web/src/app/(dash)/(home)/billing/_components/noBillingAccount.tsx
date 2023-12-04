"use client";

import { API, useTeam } from "@/libs";
import { CreditCardIcon } from "@heroicons/react/24/outline";
import { Team } from "@pixeleye/api";
import { Button, Container } from "@pixeleye/ui";
import { useMutation } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { useRouter } from 'next/navigation'

export function NoBillingAccount(
    {
        team
    }: {
        team: Team
    }
) {

    const router = useRouter()

    const createBillingAccount = useMutation({
        mutationFn: () => API.post("/v1/teams/{teamID}/billing/account", {
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
                    <CreditCardIcon
                        className="mx-auto h-12 w-12 text-on-surface"
                    />
                    <h3 className="mt-2 text-sm font-semibold text-on-surface">No billing account</h3>
                    <p className="mt-1 text-sm text-on-surface-variant">
                        You are currently using Pixeleye for free. This means you are limited to 5000 snapshots per month.
                    </p>
                    <div className="mt-6">
                        <Button className="mt-8" loading={createBillingAccount.isPending} onClick={() => createBillingAccount.mutate()}>
                            Create billing account
                        </Button>
                    </div>
                </div>
            </Container>
        </>
    )
}