import { cookies } from "next/headers";
import { Navbar } from "./navbar";
import { API } from "@/libs";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import getQueryClient from "../getQueryClient";
import { queries } from "@/queries";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();

  const [user] = await Promise.all([
    API.get("/user/me", {
      headers: {
        cookie: cookies().toString(),
      },
    }),
    queryClient.prefetchQuery(queries.user.me(cookies().toString())),
    queryClient.prefetchQuery(queries.teams.list(cookies().toString())),
  ]);

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <Navbar user={user} />
      {children}
    </HydrationBoundary>
  );
}
