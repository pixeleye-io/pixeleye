import Link from "next/link";
import { authOptions } from "@pixeleye/auth";
import { Button, Container } from "@pixeleye/ui";
import { getServerSession } from "next-auth";
import { serverApi } from "~/utils/server";

export default async function IndexPage() {
  const session = await getServerSession(authOptions);
  const projects = await serverApi(session).project.getUserProjects();

  return (
    <Container className="py-12">
      <div className="flex justify-between">
        <h1 className="text-4xl">Projects</h1>
        <Button asChild>
          <Link href="/add">Add project</Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {projects?.map((project) => (
          <div
            key={project.id}
            className="relative flex flex-col items-center justify-center w-full h-48 p-6 overflow-hidden text-center bg-white border rounded-lg shadow-sm border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700"
          >
            <h3 className="text-lg">{project.name}</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {project.url}
            </p>
            <Link href={`/project/${project.id}`}>Link</Link>
          </div>
        ))}
      </div>
    </Container>
  );
}
