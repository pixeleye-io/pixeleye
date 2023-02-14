import { authOptions } from "@pixeleye/auth";
import { Container } from "@pixeleye/ui";
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
    <Container>
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
        <div className="flex flex-col max-w-4xl mx-auto">
          <h3 className="pt-8 mb-1 text-3xl font-semibold">Getting Started</h3>
          <p className="pb-8 text-gray-700 dark:text-gray-400">
            To get started, you&apos;ll need to add a token to your project.
            This will allow you to securely upload your builds to Pixeleye.
          </p>
          <TokenView projectKey={data.key} projectId={projectId} />
        </div>
      )}
    </Container>
  );
}
