import { API } from "@/libs";
import { cookies } from "next/headers";
import { Review } from "./review";
import { getQueryClient, queries } from "@/queries";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { WaitingPage } from "./waiting";

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

  ]);

  const [project] = await Promise.all([API.get("/v1/projects/{id}", {
    params: {
      id: build.projectID,
    },
    headers: {
      cookie,
    },
  }), queryClient
    .prefetchQuery(queries.projects.detail(build.projectID, cookie))
    .catch(() => undefined),
  ]);

  const dehydratedState = dehydrate(queryClient);

  if (["uploading", "queued-uploading", "processing", "queued-processing"].includes(build.status)) {
    return (
      <HydrationBoundary state={dehydratedState}>
        <WaitingPage buildID={build.id} />
      </HydrationBoundary>
    );
  }

  if (["aborted"].includes(build.status)) {
    return (
      <HydrationBoundary state={dehydratedState}>
        <h1 className="flex flex-col items-center justify-center text-lg my-8">
          Build was aborted
        </h1>
      </HydrationBoundary>
    );
  }

  return (
    <HydrationBoundary state={dehydratedState}>
      <Review buildID={build.id} project={project} />
    </HydrationBoundary>
  );
}
