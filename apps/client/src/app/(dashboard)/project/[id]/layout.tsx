import { redirect } from "next/navigation";
import { getAppSession } from "@pixeleye/auth";
import { RegisterSegment } from "../../navbar";
import { ProjectHeader } from "./projectHeader";
import { getProject } from "./services";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const projectId = params.id;
  const session = await getAppSession();

  if (!session) redirect("/login");

  const project = await getProject(session.user.id, projectId);

  if (!project) redirect("/");

  return (
    <RegisterSegment
      reference={params.id}
      teamId={project.teamId || ""}
      order={2}
      segment={
        project
          ? {
              name: project.name,
              value: `/project/${params.id}`,
            }
          : undefined
      }
    >
      <ProjectHeader />
      {children}
    </RegisterSegment>
  );
}
