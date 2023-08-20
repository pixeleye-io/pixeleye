import { Container, Divider } from "@pixeleye/ui";
import { RegisterSegment } from "../../breadcrumbStore";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { API } from "@/libs/api";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { queries, getQueryClient } from "@/queries";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const buildID = params.id;

  const build = await API.get("/builds/{id}", {
    params: {
      id: buildID,
    },
    headers: {
      cookie: cookies().toString(),
    },
  });

  const project = await API.get("/projects/{id}", {
    params: {
      id: build.projectID,
    },
    headers: {
      cookie: cookies().toString(),
    },
  });

  const queryClient = getQueryClient();

  await Promise.all([
    queryClient.prefetchQuery(queries.user.me(cookies().toString())),
    queryClient.prefetchQuery(queries.teams.list(cookies().toString())),
  ]);

  const dehydratedState = dehydrate(queryClient);

  if (!build) notFound();

  return (
    <HydrationBoundary state={dehydratedState}>
      <RegisterSegment
        order={1}
        reference="builds"
        segment={[
          {
            name: project.name,
            value: `/projects/${build.projectID}`,
          },
          {
            name: `#${build.buildNumber}`,
            value: `/builds/${buildID}`,
          },
        ]}
      />
      <Divider />
      {children}
    </HydrationBoundary>
  );
}
