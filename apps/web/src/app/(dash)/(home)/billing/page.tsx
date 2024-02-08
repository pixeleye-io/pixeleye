import { env } from "@/env";
import { getTeam } from "@/serverLibs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ManageBillingAccount } from "./_components/manageBilling";
import { API } from "@/libs";

export default async function BillingPage({
    searchParams
}: {
    searchParams: {
        team?: string | undefined;
    }
}) {

    const cookie = cookies().toString();

    const team = await getTeam(searchParams);

    const subscription = await API.get("/v1/teams/{teamID}/billing/subscription", {
        params: {
            teamID: team!.id,
        },
        headers: {
            cookie
        }
    })

    if (env.NEXT_PUBLIC_PIXELEYE_HOSTING !== "true" && !["admin", "owner", "accountant"].includes(team.role || "")) {
        // Billing is only available for the pixeleye cloud product
        redirect("/dashboard")
    }

    return (
        <main>
            <ManageBillingAccount subscription={subscription} team={team} />
        </main>
    )

}