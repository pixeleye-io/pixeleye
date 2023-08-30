import { API } from "@/libs";
import NextLink from "next/link";
import dayjs from "dayjs";
import {
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@pixeleye/ui";
import {
  ListBulletIcon,
  Squares2X2Icon,
  ArrowTopRightOnSquareIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import relativeTime from "dayjs/plugin/relativeTime";
import { cookies } from "next/headers";
import { getTeam } from "@/serverLibs";

dayjs.extend(relativeTime);

function EmptyState({ url }: { url: string }) {
  return (
    <div className="text-center mt-12">
      <svg
        className="mx-auto h-12 w-12 text-on-surface-variant"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
        />
      </svg>
      <h3 className="mt-2 text-sm font-semibold text-on-surface">
        No projects
      </h3>
      <p className="mt-1 text-sm text-on-surface-variant">
        Get started by creating a new project.
      </p>
      <div className="mt-6">
        <Button variant="default" asChild>
          <NextLink href={url} className="flex-nowrap flex">
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Add Project
          </NextLink>
        </Button>
      </div>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { team?: string };
}) {
  const team = await getTeam(searchParams);

  const projects = await API.get("/teams/{teamID}/projects", {
    params: {
      teamID: team.id,
    },
    headers: {
      cookie: cookies().toString(),
    },
  });

  const paramsURL = new URLSearchParams(searchParams);

  const base =
    team.type === "user" && team.role === "owner"
      ? "/add"
      : "/add/" + team.type;

  const addProjectUrl = `${base}?${paramsURL.toString()}`;

  if (projects.length === 0) {
    return <EmptyState url={addProjectUrl} />;
  }

  return (
    <main className="">
      <Tabs storageKey="tabs-home" defaultValue="table">
        <div className="flex justify-end mx-4 my-8 space-x-4">
          <TabsList>
            <TabsTrigger value="table">
              <ListBulletIcon className=" w-5 h-5" />
            </TabsTrigger>
            <TabsTrigger value="cards">
              <Squares2X2Icon className=" w-5 h-5" />
            </TabsTrigger>
          </TabsList>
          <Button asChild>
            <NextLink href={addProjectUrl}>Add Project</NextLink>
          </Button>
        </div>

        <TabsContent value="table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Last build</TableHead>
                <TableHead>
                  <span className="sr-only">Repository Link</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects?.map((project) => (
                <TableRow
                  key={project.id}
                  className="relative cursor-pointer z-0"
                >
                  <TableCell className="font-medium">
                    {project.name}
                    <NextLink
                      className="absolute inset-0"
                      href={`/projects/${project.id}`}
                    >
                      <span className="sr-only">Project page</span>
                    </NextLink>
                  </TableCell>
                  <TableCell>
                    {project.lastActivity
                      ? dayjs(project.lastActivity).fromNow()
                      : "No activity"}
                  </TableCell>
                  <TableCell className="text-right z-10">
                    <Button variant={"link"} size={"sm"}>
                      View repo
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="cards">
          <div className="grid grid-cols-1 gap-4 mt-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {projects?.map((project) => (
              <div
                key={project.id}
                className="relative flex flex-col items-center justify-center w-full h-48 p-6 text-center transition border rounded-lg group/card hover:shadow-md hover:border-primary border-outline"
              >
                <h3 className="text-lg">{project.name}</h3>
                <p className="text-sm text-on-surface">{/* {project.url} */}</p>
                <NextLink
                  href={`/projects/${project.id}`}
                  className="absolute inset-0"
                >
                  <span className="sr-only">Project page</span>
                </NextLink>
                {project.url && (
                  <a
                    rel="noopener noreferrer"
                    target="_blank"
                    href={project.url}
                    className="absolute top-0 right-0 p-2 transition transform group/link border border-outline rounded-full opacity-0 hover:!bg-surface-container group-hover/card:opacity-100 bg-primary group-hover/card:translate-x-3 group-hover/card:-translate-y-3"
                  >
                    <span className="sr-only">Repo url</span>
                    <ArrowTopRightOnSquareIcon className="w-5 h-5 text-on-primary  group-hover/link:text-on-surface" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
