import { Divider } from "@pixeleye/ui";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { API } from "@/libs/api";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { queries, getQueryClient } from "@/queries";
import { BuildSegments } from "./segments";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const buildID = params.id;

  const build = await API.get("/v1/builds/{id}", {
    params: {
      id: buildID,
    },
    headers: {
      cookie: cookies().toString(),
    },
  });

  const project = await API.get("/v1/projects/{id}", {
    params: {
      id: build.projectID,
    },
    headers: {
      cookie: cookies().toString(),
    },
  });

  const queryClient = getQueryClient();

  await Promise.all([
    queryClient.prefetchQuery(queries.user.get(cookies().toString())),
    queryClient.prefetchQuery(queries.teams.list(cookies().toString())),
  ]);

  const dehydratedState = dehydrate(queryClient);

  if (!build) notFound();

  return (
    <HydrationBoundary state={dehydratedState}>
      <BuildSegments buildID={build.id} projectID={project.id} />
      <Divider />
      {children}
    </HydrationBoundary>
  );
}
