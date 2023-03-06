import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/solid";
import { authOptions } from "@pixeleye/auth";
import { Button, Container } from "@pixeleye/ui";
import { getServerSession } from "next-auth";
import { getTeam } from "./services";

export default async function IndexPage({
  searchParams,
}: {
  searchParams?: Record<string, string>;
}) {
  const teamId = searchParams?.team;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const team = await getTeam(session.user.id, teamId);

  if (!team) {
    if (teamId) redirect("/");
    else redirect("/api/auth/signin");
  }

  return (
    <Container className="py-12">
      <div className="flex justify-between">
        <h1 className="text-4xl">Projects</h1>
        <Link
          href={
            "/add/github" + (team?.type !== "USER" ? `?team=${team.id}` : "")
          }
        >
          <Button asChild>Add project</Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 mt-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {team.projects?.map((project) => (
          <div
            key={project.id}
            className="relative flex flex-col items-center justify-center w-full h-48 p-6 text-center transition bg-white border border-gray-200 rounded-lg shadow-sm shadow hover:bg-gray-50 dark:hover:bg-gray-850 group/card hover:shadow-md dark:hover:border-gray-500 hover:border-gray-400 dark:bg-gray-900 dark:border-gray-700"
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
