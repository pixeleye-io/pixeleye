import { API } from "@/libs";
import { Template } from "@/components/template";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { BuildList } from "./buildList";
import { getQueryClient, queries } from "@/queries";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

export default async function ProjectOverviewPage({
  params,
}: {
  params: {
    id: string;
  };
}) {
  const projectID = params.id;

  const cookie = cookies().toString();

  const queryClient = getQueryClient();

  const [project] = await Promise.all([
    API.get("/projects/{id}", {
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

  const dehydratedState = dehydrate(queryClient);

  return (
    <Template>
      <HydrationBoundary state={dehydratedState}>
        <BuildList projectID={projectID} />
      </HydrationBoundary>
    </Template>
  );
}
