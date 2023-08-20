"use client";

import { useProjectEvents } from "@/libs";
import { queries } from "@/queries";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@pixeleye/ui";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

export function BuildList({ projectID }: { projectID: string }) {
  useProjectEvents({projectID});

  const { data: builds } = useQuery(
    queries.projects.detail(projectID)._ctx.listBuilds()
  );

  return (
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
  );
}
