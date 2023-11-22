import { env } from "@/env";
import { getTeam } from "@/serverLibs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NoBillingAccount } from "./_components/noBillingAccount";
import { ManageBillingAccount } from "./_components/manageBilling";

export default async function BillingPage({
    searchParams
}: {
    searchParams: {
        team?: string | undefined;
    }
}) {

    const cookie = cookies().toString();

    const team = await getTeam(searchParams);


    if (env.NEXT_PUBLIC_PIXELEYE_HOSTING !== "true" && !["admin", "owner", "accountant"].includes(team.role || "")) {
        // Billing is only available for the pixeleye cloud product
        redirect("/dashboard")
    }

    return (
        <main>
            {team.billingStatus === "not_created" && (<NoBillingAccount team={team} />)}
            {team.billingStatus !== "not_created" && (<ManageBillingAccount team={team} />)}
        </main>
    )

}