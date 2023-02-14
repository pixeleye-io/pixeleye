import { authOptions } from "@pixeleye/auth";
import { getServerSession } from "next-auth";
import { serverApi } from "~/utils/server";
import TokenView from "./token";

export default async function ProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const projectId = params.id;
  const session = await getServerSession(authOptions);
  const data = await serverApi(session).project.getProjectWithBuilds({
    id: projectId,
  });

  return (
    <div>
      <h1>Project {projectId}</h1>
      {data.builds && data.builds.length > 0 ? (
        <>
          <p>Builds</p>
          <ul>
            {data.builds.map((build) => (
              <li key={build.id}>{build.id}</li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <p>Get Started</p>
          <TokenView projectKey={data.key} projectId={projectId} />
        </>
      )}
    </div>
  );
}
