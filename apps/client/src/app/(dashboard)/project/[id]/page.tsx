import { authOptions } from "@pixeleye/auth";
import { getServerSession } from "next-auth";
import { serverApi } from "~/utils/server";

export default async function ProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const data = await serverApi(session).project.getProject({ id: params.id });

  return (
    <div>
      <h1>Project {data!.id}</h1>
    </div>
  );
}
