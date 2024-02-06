import { API } from "@/libs";
import { getTeam } from "@/serverLibs";
import { StripeElementsOptions, loadStripe } from "@stripe/stripe-js";
import { useTheme } from "next-themes";
import { cookies } from "next/headers";
import { Payment } from "./_components/payment";
import { env } from "@/env";
import { redirect } from "next/navigation";



export default async function SubscribePage({
    searchParams
}: {
    searchParams: {
        team?: string | undefined;
    }
}) {

    const team = await getTeam(searchParams);

    const cookie = cookies().toString();


    if (team.planID) {
        redirect(`/billing${team.type !== "user" ? `?team=${team.id}` : ""}`);
    }


    const setupIntent = await API.post("/v1/teams/{teamID}/billing/account2", {
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
        <Payment clientSecret={setupIntent.clientSecret} teamID={team.id} />
    )





}