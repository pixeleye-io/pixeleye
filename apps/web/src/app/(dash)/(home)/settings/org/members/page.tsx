import { API } from "@/libs";
import { SettingsTemplate } from "../../settingsTemplate";
import { getTeam } from "@/serverLibs";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@pixeleye/ui";
import { getQueryClient, queries } from "@/queries";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { MemberSection } from "./sections";

export default async function OrgMemberSettings({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const team = await getTeam(searchParams);

  const queryClient = getQueryClient();

  const cookie = cookies().toString();

  if (team.type === "user") {
    redirect("/settings");
  }

  await Promise.all([
    queryClient.prefetchQuery(
      queries.teams.detail(team.id, cookie)._ctx.listMembers()._ctx.git()
    ),
    queryClient.prefetchQuery(
      queries.teams.detail(team.id, cookie)._ctx.listMembers()._ctx.invited()
    ),
  ]);

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <SettingsTemplate
        title={"Git members"}
        description="List of team members synced from your VCS provider."
      >
        <MemberSection team={team} type="git" />
      </SettingsTemplate>
      <SettingsTemplate
        title={"Invited members"}
        description="List of team members manually invited directly to this team or via a project."
      >
        <MemberSection team={team} type="invited" />
      </SettingsTemplate>
    </HydrationBoundary>
  );
}
