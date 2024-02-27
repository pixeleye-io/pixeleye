import { API, useTeam, } from "@/libs"
import { queries } from "@/queries"
import { getTeam } from "@/serverLibs"
import { Input } from "@pixeleye/ui"
import { useQueries } from "@tanstack/react-query"
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { Code } from "./code"
import { env } from "@/env"

export default async function ReferralPage({ searchParams }: {
    searchParams: Record<string, string>;
}) {

    if (env.NEXT_PUBLIC_PIXELEYE_HOSTING !== "true") notFound()

    if (searchParams.team) redirect("/settings/referrals")

    const cookie = cookies().toString()

    const [team, user] = await Promise.all([
        getTeam({}), // We don't pass search params as we only want the users personal team
        API.get("/v1/user/me", {
            headers: {
                cookie,
            },
        }),
    ]);

    return (
        <div className="mx-auto max-w-md sm:max-w-3xl">
            <div>
                <div className="text-center">
                    <svg
                        className="mx-auto h-12 w-12 text-on-surface-variant"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A10.003 10.003 0 0124 26c4.21 0 7.813 2.602 9.288 6.286M30 14a6 6 0 11-12 0 6 6 0 0112 0zm12 6a4 4 0 11-8 0 4 4 0 018 0zm-28 0a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                    </svg>
                    <h2 className="mt-2 text-base font-semibold leading-6 text-on-surface">Refer friends; get free snaps</h2>
                    <p className="mt-1 text-sm text-on-surface-variant">When you refer a friend, you both get an additional 1,250 free snapshots every month for a total of 2,500</p>
                    <div>

                        {
                            team?.referrals || 0 >= 2 ? (
                                <p>
                                    You&apos;re popular! You&apos;ve maxed out your referrals and are now receiving the max amount of snapshots, 7,500!
                                </p>
                            ) : (
                                <Code code={user.id} />
                            )
                        }

                    </div>
                </div>

            </div>
        </div>
    )
}