import { getTeam } from "@/serverLibs";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { UpdateAccountData } from "./profileSections";
import { API } from "@/libs";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const cookie = cookies().toString();

  const [team, user] = await Promise.all([
    getTeam(searchParams),
    API.get("/v1/user/me", {
      headers: {
        cookie,
      },
    }),
  ]);

  if (team.type !== "user") {
    redirect(`/settings/org?team=${team.id}`);
  }

  return (
    <main>
      <UpdateAccountData user={user} />
    </main>
  );
}
