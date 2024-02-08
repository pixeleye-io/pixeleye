"use client";

import { API, useTeam } from "@/libs";
import { CreditCardIcon } from "@heroicons/react/24/outline";
import { Team, Subscription } from "@pixeleye/api";
import { Button, Container, Input, Link, Switch, Toggle, Dialog, DialogContent, DialogHeader, DialogDescription, DialogFooter, DialogPortal, DialogTitle, DialogTrigger } from "@pixeleye/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import { useEffect, useState } from "react";
import { queries } from "@/queries";
import { useForm } from "react-hook-form";

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

    console.log(team)


    const [snapshotsLimited, setSnapshotsLimited] = useState((team.snapshotLimit || 0) >= 5000)

    const queryClient = useQueryClient()


    const [limitSnapsOpen, setLimitSnapsOpen] = useState(false)

    const updateSnapshotLimit = useMutation({
        mutationFn: (limit: number) => API.post("/v1/teams/{teamID}/billing/limit", {
            params: {
                teamID: team!.id,
            },
            body: {
                limit: snapshotsLimited ? limit * 1000 : 0
            }
        }).then(() => snapshotsLimited ? limit * 1000 : 0),
        onSuccess: (limit) => {
            queryClient.invalidateQueries(queries.teams.detail(team.id))
            setSnapshotsLimited(limit * 1000 >= 5000)
            setLimitSnapsOpen(false)
        }
    })


    const { register, handleSubmit } = useForm<{ limit: number }>({
        defaultValues: {
            limit: !team.snapshotLimit || team.snapshotLimit < 5000 ? 100 : team.snapshotLimit / 1000
        }
    })


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
                            <div className="mt-6 flex flex-col space-y-8">

                                <div className="flex space-x-4 items-center justify-center">

                                    <Button className="w-fit" loading={manageBillingAccount.isPending} onClick={() => manageBillingAccount.mutate()}>
                                        Manage account
                                    </Button>

                                    <Dialog open={limitSnapsOpen} onOpenChange={setLimitSnapsOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="secondary">
                                                Limit snapshots
                                            </Button>
                                        </DialogTrigger>

                                        <DialogPortal>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Limit snapshots</DialogTitle>
                                                    <DialogDescription>
                                                        Limit the number of snapshots that can be taken per month.

                                                    </DialogDescription>
                                                </DialogHeader>

                                                <form onSubmit={handleSubmit((({ limit }) => updateSnapshotLimit.mutate(limit)))}>

                                                    <div className="space-y-4 flex flex-col my-8">

                                                        <div className="space-y-4 flex flex-col max-w-56">
                                                            <label className="flex space-x-4">
                                                                <span>Enable limit</span>
                                                                <Switch checked={snapshotsLimited} onCheckedChange={setSnapshotsLimited} />
                                                            </label>
                                                            <Input step="0.001" suffix="/k" label="Limit (thousand)" defaultValue={100} type="number" min={5} disabled={!snapshotsLimited} {...register("limit", {
                                                                min: 5
                                                            })} />

                                                        </div>

                                                        <p className="text-on-surface-variant">
                                                            Your first 5k snapshots are free.
                                                        </p>
                                                    </div>


                                                    <DialogFooter>
                                                        <Button type="button" variant="secondary" onClick={() => setLimitSnapsOpen(false)}>Cancel</Button>
                                                        <Button loading={updateSnapshotLimit.isPending} type="submit">Save</Button>
                                                    </DialogFooter>
                                                </form>

                                            </DialogContent>
                                        </DialogPortal>



                                    </Dialog>
                                </div>
                            </div></>
                        )
                    }
                </div>
            </Container >

        </>
    )
}