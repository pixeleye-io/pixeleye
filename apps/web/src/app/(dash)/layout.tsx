import { cookies } from "next/headers";
import { Navbar } from "./navbar";
import { API } from "@/libs";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { queries, getQueryClient } from "@/queries";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();

  const cookie = cookies().toString();

  const [user, teams] = await Promise.all([
    API.get("/user/me", {
      headers: {
        cookie,
      },
    }),
    API.get("/user/teams", {
      headers: {
        cookie,
      },
    }),
    queryClient.prefetchQuery(queries.user.me(cookie)),
    queryClient.prefetchQuery(queries.teams.list(cookie)),
  ]);

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <Navbar user={user} teams={teams} />
      {children}
    </HydrationBoundary>
  );
}
