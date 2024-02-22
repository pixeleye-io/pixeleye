import { API } from "@/libs";
import { cookies } from "next/headers";
import { Review } from "./review";
import { queries } from "@/queries";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { WaitingPage } from "./waiting";
import { Button, Link } from "@pixeleye/ui";
import NextLink from "next/link";

export default async function ProjectOverviewPage({
  params,
}: {
  params: {
    id: string;
  };
}) {
  const buildID = params.id;

  const queryClient = new QueryClient()

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


  if (["uploading", "queued-uploading", "processing", "queued-processing"].includes(build.status)) {
    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        <WaitingPage buildID={build.id} />
      </HydrationBoundary>
    );
  }

  if (["aborted"].includes(build.status)) {
    return (
      <HydrationBoundary state={dehydratedState}>
        <div className="text-center py-12">
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-on-surface">Build was aborted</h1>
          <p className="mt-4 text-base leading-7 text-on-surface-variant">Either manually or during the ci/cd pipeline, this build was canceled</p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button asChild>
              <NextLink
                href={`/projects/${project.id}`}
              >
                Back to builds
              </NextLink>
            </Button>

            <Link href="#">
              More information <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </HydrationBoundary>
    );
  }



  return (
    <HydrationBoundary state={dehydratedState}>
      <Review buildID={build.id} project={project} />
    </HydrationBoundary>
  );
}
