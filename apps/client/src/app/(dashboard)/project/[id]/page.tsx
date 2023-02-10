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

  const builds = await serverApi(session).project.getBuilds({
    projectId: params.id,
  });

  return (
    <div>
      <h1>Project {data.id}</h1>
      {builds && builds.length > 0 ? (
        <>
          <p>Builds</p>
          <ul>
            {builds.map((build) => (
              <li key={build.id}>{build.id}</li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <p>No builds</p>
          <p>Token: {data.tokenHash}</p>
        </>
      )}
    </div>
  );
}
