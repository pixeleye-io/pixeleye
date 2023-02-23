import { authOptions } from "@pixeleye/auth";
import { getServerSession } from "next-auth/next";
import { serverApi } from "~/lib/server";
import { RegisterSegment } from "../../../navbar";

export default async function ReviewLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string; snapId: string };
}) {
  const session = await getServerSession(authOptions);
  const data = await serverApi(session).build.getWithProject({ id: params.id });

  return (
    <RegisterSegment
      reference={params.snapId}
      teamId={data.Project.teamId || ""}
      order={3}
      segment={
        data
          ? [
              {
                name: "review",
                value: `/build/${data.id}`,
              },
            ]
          : undefined
      }
    >
      {children}
    </RegisterSegment>
  );
}
