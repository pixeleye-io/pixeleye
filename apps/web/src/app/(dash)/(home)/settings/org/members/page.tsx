import { RegisterSegment } from "@/app/(dash)/breadcrumbStore";
import { Input } from "@pixeleye/ui";
import { SettingsTemplate } from "../../settingsTemplate";
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
      <SettingsTemplate
        title="Auto permissions"
        description="Sync your permissions with your vcs provider"
      >
        <p>This feature is coming soon.</p>
      </SettingsTemplate>
      <SettingsTemplate
        title="Git members"
        description="Manually manage your members from your vcs provider"
      >
        <p>This feature is coming soon.</p>
      </SettingsTemplate>
      <SettingsTemplate
        title="Invited members"
        description="Manage your invited members"
      >
        <p>This feature is coming soon.</p>
      </SettingsTemplate>
    </>
  );
}
