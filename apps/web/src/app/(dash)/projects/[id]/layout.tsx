import { Container } from "@pixeleye/ui";
import { ProjectHeader } from "./projectHeader";
import { RegisterSegment } from "../../breadcrumbStore";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { API } from "@/libs/api";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const projectId = params.id;

  const project = await API.get("/v1/projects/{id}", {
    params: {
      id: projectId,
    },
    headers: {
      cookie: cookies().toString(),
    },
  }).catch(() => undefined);

  // TODO - make this a client component so we can update the breadcrumb

  if (!project) notFound();

  return (
    <>
      <RegisterSegment
        order={1}
        reference="projects"
        segment={{
          name: project.name,
          value: `/projects/${projectId}`,
        }}
        teamId={project.teamID}
      />
      <ProjectHeader projectId={projectId} />
      <Container className="container">{children}</Container>
    </>
  );
}
