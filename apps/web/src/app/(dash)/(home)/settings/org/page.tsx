import { getTeam } from "@/serverLibs";
import { redirect } from "next/navigation";
import { SettingsTemplate } from "../settingsTemplate";
import { OrgProfileSettingsSection } from "./sections";

export default async function OrgSettingsPage({
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
      <SettingsTemplate title="Profile" description="Manage your profile">
        <OrgProfileSettingsSection />
      </SettingsTemplate>
    </>
  );
}
