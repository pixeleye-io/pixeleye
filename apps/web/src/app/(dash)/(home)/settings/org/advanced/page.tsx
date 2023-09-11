import { getTeam } from "@/serverLibs";
import { redirect } from "next/navigation";

export default async function OrgMemberSettings({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const team = await getTeam(searchParams);

  if (team.type === "user") {
    redirect("/settings");
  }

  return (
    <>
      <h1>Settings</h1>
    </>
  );
}
