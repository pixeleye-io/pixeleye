import { redirect } from "next/navigation";
import { getAppSession } from "@pixeleye/auth";
import { RegisterSegment } from "../../navbar";
import { BuildHeader } from "./buildHeader";
import { getBuild } from "./services";

export default async function BuildLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const buildId = params.id;
  const session = await getAppSession();

  if (!session) redirect("/login");

  const build = await getBuild(buildId, session.user.id);

  if (!build) redirect("/");

  return (
    <>
      <RegisterSegment
        reference={params.id}
        teamId={build.projectId}
        order={2}
        segment={
          build
            ? [
                {
                  name: build.project.name,
                  value: `/project/${build.projectId}`,
                },
                {
                  name: build.name || "Unnamed Build",
                  value: `/build/${buildId}`,
                  status: build.status,
                },
              ]
            : undefined
        }
      >
        <BuildHeader buildId={buildId} />
        {children}
      </RegisterSegment>
    </>
  );
}
