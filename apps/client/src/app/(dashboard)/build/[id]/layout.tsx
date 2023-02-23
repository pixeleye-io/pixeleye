import { authOptions } from "@pixeleye/auth";
import { getServerSession } from "next-auth/next";
import { serverApi } from "~/lib/server";
import { RegisterSegment } from "../../navbar";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const data = await serverApi(session).build.getWithProject({ id: params.id });

  return (
    <RegisterSegment
      reference={params.id}
      teamId={data.Project.teamId || ""}
      order={2}
      segment={
        data
          ? [
              {
                name: data.Project.name,
                value: `/project/${data.Project.id}`,
              },
              {
                name: data.id,
                value: `/build/${data.id}`,
                status: data.status,
              },
            ]
          : undefined
      }
    >
      <hr className="w-full border-t border-neutral-300 dark:border-neutral-700" />

      {children}
    </RegisterSegment>
  );
}
