import { authOptions } from "@pixeleye/auth";
import { getServerSession } from "next-auth/next";
import { serverApi } from "~/lib/server";
import { RegisterSegment } from "../../navbar";
import { ProjectHeader } from "./projectHeader";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const data = await serverApi(session).project.getProject({ id: params.id });

  return (
    <RegisterSegment
      reference={params.id}
      teamId={data.teamId || ""}
      order={2}
      segment={
        data
          ? {
              name: data.name,
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
