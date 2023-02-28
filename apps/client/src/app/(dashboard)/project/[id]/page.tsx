import Link from "next/link";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import { authOptions } from "@pixeleye/auth";
import { Container } from "@pixeleye/ui";
import Status, { StatusType } from "@pixeleye/ui/src/status";
import { getServerSession } from "next-auth";
import { RouterOutputs } from "~/lib/api";
import { serverApi } from "~/lib/server";
import timeSince from "~/lib/utils/dateSince";
import TokenView from "./token";

function BuildItem({
  build,
}: {
  build: RouterOutputs["project"]["getProjectWithBuilds"]["builds"][0];
}) {
  return (
    <li>
      <Link
        href={`/build/${build.id}`}
        className="block transition border border-gray-200 rounded-md active:rounded-xl hover:bg-gray-50 dark:hover:bg-gray-850 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
      >
        <div className="flex items-center px-4 py-4 sm:px-6">
          <div className="flex-1 min-w-0 sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center space-x-6">
              <Status status={build.status} size="lg" />
              <div className="truncate">
                <div className="flex text-sm">
                  <p className="font-medium text-gray-900 truncate dark:text-white">
                    {build.commitMessage || build.name}
                  </p>
                </div>
                <div className="flex mt-2">
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-base">
                    {build.branch}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 mt-4 sm:mt-0 sm:ml-5">
              <div className="flex -space-x-1 overflow-hidden">
                <div className="flex items-center text-sm text-gray-500">
                  <p>
                    <span>{timeSince(build.createdAt)}</span> ago
                    {build.author && (
                      <>
                        {" "}
                        by <span>{build.author}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 ml-5">
            <ChevronRightIcon
              className="w-5 h-5 text-gray-400"
              aria-hidden="true"
            />
          </div>
        </div>
      </Link>
    </li>
  );
}

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
          <div className="my-8">
            <h2 className="text-3xl font-semibold">Builds</h2>
          </div>
          <ul className="mb-12 space-y-4">
            {data.builds.map((build) => (
              <BuildItem build={build} key={build.id} />
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
