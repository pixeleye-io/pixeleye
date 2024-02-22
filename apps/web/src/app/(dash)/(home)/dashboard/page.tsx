import { cookies } from "next/headers";
import { getTeam } from "@/serverLibs";
import { DashboardProjects } from "./projects";
import { queries } from "@/queries";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { team?: string };
}) {
  const team = await getTeam(searchParams);

  const queryClient = new QueryClient()

  const cookie = cookies().toString();

  await queryClient.prefetchQuery(
    queries.teams.detail(team.id, cookie)._ctx.listProjects()
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardProjects team={team} />
    </HydrationBoundary>
  );
}
