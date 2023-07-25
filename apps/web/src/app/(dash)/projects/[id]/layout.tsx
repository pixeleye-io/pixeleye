import { Container } from "@pixeleye/ui";
import { ProjectHeader } from "./projectHeader";
import { RegisterSegment } from "../../breadcrumbStore";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import API from "@pixeleye/api";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
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
      <RegisterSegment
        order={1}
        reference="projects"
        segment={{
          name: project.name,
          value: `/projects/${projectId}`,
        }}
      />
      <ProjectHeader projectId={projectId} />
      <Container>{children}</Container>
    </>
  );
}
