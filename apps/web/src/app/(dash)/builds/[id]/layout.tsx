import { Divider } from "@pixeleye/ui";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { API } from "@/libs/api";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { queries } from "@/queries";
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

  const queryClient = new QueryClient()

  await Promise.all([
    queryClient.prefetchQuery(queries.user.get(cookies().toString())),
    queryClient.prefetchQuery(queries.teams.list(cookies().toString())),
  ]);


  if (!build) notFound();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BuildSegments buildID={build.id} projectID={project.id} />
      <div className="h-[calc(100vh-3rem)]">
        <Divider />
        {children}
      </div>
    </HydrationBoundary>
  );
}
