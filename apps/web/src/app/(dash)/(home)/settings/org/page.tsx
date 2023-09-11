import { getTeam } from "@/serverLibs";
import { redirect } from "next/navigation";
import { SettingsTemplate } from "../settingsTemplate";
import { Input } from "@pixeleye/ui";

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
        <form className="space-y-4">
          <Input label="Name" />
          <Input label="Website" />
        </form>
      </SettingsTemplate>
    </>
  );
}
