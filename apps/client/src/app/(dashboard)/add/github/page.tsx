import Link from "next/link";
import { Button, Container } from "@pixeleye/ui";
import Avatar from "~/components/avatar";
import { RepoList } from "./repos";
import { getGithubRepos, getOtherInstalls, getTeamId } from "./services";

export default async function AddGithubPage({
  searchParams,
}: {
  searchParams?: Record<string, string>;
}) {
  const teamId = await getTeamId(searchParams?.team);

  const [repoData, otherInstalls] = await Promise.all([
    getGithubRepos(teamId),
    getOtherInstalls(teamId),
  ]);

  return (
    <Container>
      <div className="flex mx-8 mt-12 space-x-8">
        <aside className="sticky flex flex-col items-center top-4 w-80 h-min">
          <Avatar
            size="xl"
            src={repoData.repos.owner.avatar}
            name={repoData.repos.owner.name}
          />
          <h3 className="mt-4 text-xl font-semibold">
            {repoData.repos.owner.name}
          </h3>
          <a
            rel="noopener"
            target="_blank"
            className="text-xs text-gray-700 transition dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            href={repoData.repos.owner.url}
          >
            {repoData.repos.owner.url}
          </a>
          <div className="inline-block mt-6">
            <Button variant="secondary" size="small" asChild>
              <a
                className="inline-block"
                href="https://github.com/apps/pixeleye-io/installations/new"
              >
                Manage on github
              </a>
            </Button>
          </div>
          {otherInstalls.length > 0 && (
            <div className="mt-16 w-52">
              <h4 className="mb-2 text-gray-700 dark:text-gray-200">
                Other installs:
              </h4>
              <ul className="mt-2">
                {otherInstalls.map((install) => (
                  <li key={install.name}>
                    <Link
                      className="flex space-x-2"
                      href={`/add/github?team=${install.id!}`}
                    >
                      <Avatar
                        size="sm"
                        src={install.avatar}
                        name={install.name || ""}
                      />
                      <p className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                        {install.name}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
        <div className="w-full overflow-hidden grow">
          {repoData.repos && (
            <RepoList
              teamId={teamId}
              installId={repoData.installId}
              repos={repoData.repos.repos}
            />
          )}
        </div>
      </div>
    </Container>
  );
}
