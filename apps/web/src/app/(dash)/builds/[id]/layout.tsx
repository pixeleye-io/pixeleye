import { Button, Divider } from "@pixeleye/ui";
import { notFound } from "next/navigation";
import Link from "next/link";
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
  }).catch((err) => {
    if (err.status === 404) {
      return undefined;
    }
    throw err;
  })



  if (!build) {
    return (
      <div className="text-center py-12">
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-on-surface">Build not found</h1>
        <p className="mt-4 text-base leading-7 text-on-surface-variant">The build you are looking for does not exist</p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Button asChild>
            <Link href="/dashboard">
              Back to dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }

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
      <div className="h-[calc(100vh-3rem)] flex flex-col">
        <Divider />
        {children}
      </div>
    </HydrationBoundary>
  );
}
