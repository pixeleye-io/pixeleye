import { API } from "@pixeleye/api";
import Link from "next/link";
import { headers, cookies } from "next/headers";
import dayjs from "dayjs";
import {
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Container,
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@pixeleye/ui";
import {
  ListBulletIcon,
  Squares2X2Icon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default async function DashboardPage() {
  // const auth = await getUser(32960904);

  // const testing = await fetch("https://api.github.com/user/32960904", {
  //   headers: {
  //       Authorization: `token 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`,
  //   },
  // })

  // console.log(auth);

  // console.log("testing", testing.headers);

  const projects = await API.get("/projects", {
    headers: {
      cookie: cookies().toString(),
    },
  });

  return (
    <main className="">
      <Container>
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
              <Link href="/add">Add Project</Link>
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
                      <Link
                        className="absolute inset-0"
                        href={`/project/${project.id}`}
                      >
                        <span className="sr-only">Project page</span>
                      </Link>
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
                  className="relative flex flex-col items-center justify-center w-full h-48 p-6 text-center transition border rounded-lg group/card hover:shadow-md  hover:border-primary  border-outline"
                >
                  <h3 className="text-lg">{project.name}</h3>
                  <p className="text-sm text-on-surface">
                    {/* {project.url} */}
                  </p>
                  <Link
                    href={`/project/${project.id}`}
                    className="absolute inset-0"
                  >
                    <span className="sr-only">Project page</span>
                  </Link>
                  {/* {project.url && (
                <a
                  rel="noopener noreferrer"
                  target="_blank"
                  href={project.url}
                  className="absolute top-0 right-0 p-2 transition transform group/link bg-black border border-black rounded-full opacity-0 dark:hover:!bg-gray-900 hover:!bg-white dark:border-white group-hover/card:opacity-100 dark:bg-white group-hover/card:translate-x-3 group-hover/card:-translate-y-3"
                >
                  <span className="sr-only">Repo url</span>
                  <ArrowTopRightOnSquareIcon className="w-5 h-5 text-white dark:text-black dark:group-hover/link:text-white group-hover/link:text-black" />
                </a>
              )} */}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </Container>
    </main>
  );
}
