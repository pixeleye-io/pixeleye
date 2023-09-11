import { getTeam } from "@/serverLibs";
import { redirect } from "next/navigation";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const team = await getTeam(searchParams);

  if (team.type !== "user") {
    redirect(`/settings/org?team=${team.id}`);
  }

  return (
    <main>
      <h1>Settings</h1>
    </main>
  );
}
