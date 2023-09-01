import { SettingsTemplate } from "../settingsTemplate";
import { Input } from "@pixeleye/ui";

export default function OrgSettingsPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  return (
    <>
      <SettingsTemplate title="Profile" description="Manage your profile">
        <form className="space-y-4">
          <Input label="Name" />
          <Input label="Website" />
        </form>
      </SettingsTemplate>
    </>
  );
}
