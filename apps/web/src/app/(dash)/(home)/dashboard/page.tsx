import { cookies } from "next/headers";
import { getTeam } from "@/serverLibs";
import { DashboardProjects } from "./projects";
import { getQueryClient, queries } from "@/queries";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { team?: string };
}) {
  const team = await getTeam(searchParams);

  const queryClient = getQueryClient();

  const cookie = cookies().toString();

  await queryClient.prefetchQuery(
    queries.teams.detail(team.id, cookie)._ctx.listProjects()
  );

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <DashboardProjects team={team} />
    </HydrationBoundary>
  );
}
