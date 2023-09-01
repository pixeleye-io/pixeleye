import { RegisterSegment } from "@/app/(dash)/breadcrumbStore";
import { Input } from "@pixeleye/ui";
import { SettingsTemplate } from "../../settingsTemplate";

export default function OrgMemberSettings({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
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
