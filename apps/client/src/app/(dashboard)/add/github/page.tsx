import { redirect } from "next/navigation";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import { prisma } from "@pixeleye/db";
import { getGitProvider } from "@pixeleye/git";
import { Container } from "@pixeleye/ui";
import { getSession } from "next-auth/react";
import Avatar from "~/components/avatar";

async function getGithubRepos(teamId?: string) {
  if (!teamId) {
    const session = await getSession();
    const userOnTeam = await prisma.userOnTeam.findFirst({
      where: {
        userId: session?.user.id,
        role: "OWNER",
      },
    });
    if (!userOnTeam) return redirect("/");
    teamId = userOnTeam.teamId;
  }
  const source = await prisma.source.findUnique({
    where: {
      type_teamId: {
        teamId: teamId,
        type: "GITHUB",
      },
    },
  });

  if (!source?.githubInstallId) return redirect("/");

  const git = await getGitProvider(source);

  return git.listRepos();
}

export default async function AddGithubPage({
  searchParams,
}: {
  searchParams?: Record<string, string>;
}) {
  const teamId = searchParams?.team;

  const repos = await getGithubRepos(teamId);

  return (
    <Container className="!max-w-3xl">
      <div>
        <h1 className="py-12 text-2xl font-bold">Add Github</h1>
      </div>
      <ul
        role="list"
        className="relative mx-auto overflow-hidden border border-gray-200 divide-y divide-gray-200 rounded-lg dark:border-gray-800 dark:divide-gray-800"
      >
        {repos?.map((repo) => (
          <li key={repo.id}>
            <a
              href="#"
              className="block hover:bg-gray-50 dark:hover:bg-gray-850"
            >
              <div className="flex items-center px-4 py-4 sm:px-6">
                <div className="flex-1 min-w-0 sm:flex sm:items-center sm:justify-between">
                  <div className="truncate">
                    <div className="flex text-sm">
                      <p className="font-medium text-gray-900 truncate dark:text-white">
                        {repo.name}
                      </p>
                      <p className="flex-shrink-0 ml-1 font-normal text-gray-500">
                        in {repo.name}
                      </p>
                    </div>
                    <div className="flex mt-2">
                      <div className="flex items-center text-sm text-gray-500">
                        Test
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 mt-4 sm:mt-0 sm:ml-5">
                    <div className="flex -space-x-1 overflow-hidden">
                      {repo.contributors.map((contributor) => (
                        <Avatar
                          key={contributor.id}
                          name={contributor.name}
                          src={contributor.avatar}
                          className="ring ring-white dark:ring-gray-900"
                          size="sm"
                        />
                      ))}
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
            </a>
          </li>
        ))}
      </ul>
    </Container>
  );
}
