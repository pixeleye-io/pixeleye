import API from "@pixeleye/api";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

export default async function ProjectOverviewPage({
  params,
}: {
  params: {
    id: string;
  };
}) {
  const projectId = params.id;

  const project = await API.get("/projects/{id}", {
    params: {
      id: projectId,
    },
    headers: {
      cookie: cookies().toString(),
    },
  }).catch(() => undefined);

  if (!project) return notFound();

  return (
    <>
      Project
      <span></span>
    </>
  );
}
