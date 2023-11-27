import { API } from "@/libs";
import { cookies } from "next/headers";
import { Review } from "./review";
import { getQueryClient, queries } from "@/queries";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

export default async function ProjectOverviewPage({
  params,
}: {
  params: {
    id: string;
  };
}) {
  const buildID = params.id;

  const queryClient = getQueryClient();

  const cookie = cookies().toString();

  const [build] = await Promise.all([
    API.get("/v1/builds/{id}", {
      params: {
        id: buildID,
      },
      headers: {
        cookie,
      },
    }),
    queryClient
      .prefetchQuery(
        queries.builds.detail(buildID, cookie)._ctx.listSnapshots()
      )
      .catch(() => undefined),
    queryClient
      .prefetchQuery(queries.projects.detail(buildID, cookie))
      .catch(() => undefined),
  ]);

  const project = await API.get("/v1/projects/{id}", {
    params: {
      id: build.projectID,
    },
    headers: {
      cookie,
    },
  });

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <Review buildID={build.id} project={project} />
    </HydrationBoundary>
  );
}
