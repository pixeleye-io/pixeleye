import { API } from "@/libs";
import { Template } from "@/components/template";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Button,
} from "@pixeleye/ui";
import dayjs from "dayjs";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ProjectOverviewPage({
  params,
}: {
  params: {
    id: string;
  };
}) {
  const projectId = params.id;

  const project = await API.get("/projects/{id}", {
    params: {
      id: projectId,
    },
    headers: {
      cookie: cookies().toString(),
    },
  }).catch(() => undefined);

  if (!project) return notFound();

  const builds = await API.get("/projects/{id}/builds", {
    params: {
      id: projectId,
    },
    queries: {
      branch: "",
    },
    headers: {
      cookie: cookies().toString(),
    },
  });


  return (
    <Template>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {builds?.map((build) => (
            <TableRow key={build.id} className="relative cursor-pointer z-0">
              <TableCell className="font-medium">
                Build #{build.buildNumber}
                <Link className="absolute inset-0" href={`/builds/${build.id}`}>
                  <span className="sr-only">Project page</span>
                </Link>
              </TableCell>
              <TableCell>{build.branch}</TableCell>
              <TableCell>{build.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Template>
  );
}
