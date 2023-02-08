import { authOptions } from "@pixeleye/auth";
import { getServerSession } from "next-auth";
import { serverApi } from "~/utils/server";
import { RegisterSegment } from "../../navbar";

export default async function ProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const data = await serverApi(session).project.getProject({ id: params.id });

  if (!data) return <>Project not found</>;

  return (
    <RegisterSegment
      reference={params.id}
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
      <div>
        <h1>Project {data.id}</h1>
      </div>
    </RegisterSegment>
  );
}
