import { getTeam } from "@/serverLibs";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { UpdateAccountData } from "./accountSections";
import { API } from "@/libs";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const cookie = cookies().toString();

  const [team, user] = await Promise.all([
    getTeam(searchParams),
    API.get("/user/me", {
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
