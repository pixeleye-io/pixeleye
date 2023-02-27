import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/solid";
import { authOptions } from "@pixeleye/auth";
import { Button, Container } from "@pixeleye/ui";
import { getServerSession } from "next-auth";
import { serverApi } from "~/lib/server";

export default async function IndexPage({
  searchParams,
}: {
  searchParams?: Record<string, string>;
}) {
  const teamId = searchParams?.team;
  const session = await getServerSession(authOptions);
  const team = await serverApi(session)
    .team.getUserTeam({ id: teamId })
    .catch(() => {
      // Probably a bad team id, redirect to personal team
      if (teamId) redirect("/");
    });
  const projects = team?.id
    ? await serverApi(session).project.getTeamProjects({
        teamId: team.id,
      })
    : [];

  return (
    <Container className="py-12">
      <div className="flex justify-between">
        <h1 className="text-4xl">Projects</h1>
        <Button asChild>
          <Link
            href={
              "/add/github" + (team?.type !== "USER" ? `?team=${team?.id}` : "")
            }
          >
            Add project
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 mt-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {projects?.map((project) => (
          <div
            key={project.id}
            className="relative flex flex-col items-center justify-center w-full h-48 p-6 text-center transition bg-white border border-gray-200 rounded-lg shadow-sm shadow group/card hover:shadow-md dark:hover:border-white hover:border-black dark:bg-gray-900 dark:border-gray-700"
          >
            <h3 className="text-lg break-all">{project.name}</h3>
            <p className="text-sm text-gray-500 break-all dark:text-gray-400 ">
              {project.url}
            </p>
            <Link href={`/project/${project.id}`} className="absolute inset-0">
              <span className="sr-only">Project page</span>
            </Link>
            {project.url && (
              <a
                rel="noopener noreferrer"
                target="_blank"
                href={project.url}
                className="absolute top-0 right-0 p-2 transition transform group/link bg-black border border-black rounded-full opacity-0 dark:hover:!bg-gray-900 hover:!bg-white dark:border-white group-hover/card:opacity-100 dark:bg-white group-hover/card:translate-x-3 group-hover/card:-translate-y-3"
              >
                <span className="sr-only">Repo url</span>
                <ArrowTopRightOnSquareIcon className="w-5 h-5 text-white dark:text-black dark:group-hover/link:text-white group-hover/link:text-black" />
              </a>
            )}
          </div>
        ))}
      </div>
    </Container>
  );
}
