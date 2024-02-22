import { API } from "@/libs";
import { Template } from "@/components/template";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { BuildList } from "./buildList";
import {  queries } from "@/queries";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";

export default async function ProjectOverviewPage({
  params,
}: {
  params: {
    id: string;
  };
}) {
  const projectID = params.id;

  const cookie = cookies().toString();

  const queryClient = new QueryClient()

  const [project] = await Promise.all([
    API.get("/v1/projects/{id}", {
      params: {
        id: projectID,
      },
      headers: {
        cookie,
      },
    }).catch(() => undefined),
    queryClient
      .prefetchQuery(
        queries.projects.detail(projectID, cookie)._ctx.listBuilds()
      )
      .catch(() => undefined),
  ]);

  if (!project) return notFound();

  return (
    <Template>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <BuildList projectID={projectID} />
      </HydrationBoundary>
    </Template>
  );
}
