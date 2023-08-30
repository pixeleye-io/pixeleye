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
  Button,
} from "@pixeleye/ui";
import { useQuery } from "@tanstack/react-query";
import NextLink from "next/link";
import { SecuritySection } from "./manage/sections";

function EmptyState({ id }: { id: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <h3 className="text-base font-semibold text-on-surface">No builds</h3>
      <p className="mt-1 text-sm text-on-surface-variant mb-8">
        We need to integrate Pixeleye with your CI to get started.
      </p>

      <SecuritySection id={id} />

      <div className="mt-6">
        <Button asChild>
          <NextLink href="https://pixeleye.io/docs">Integration docs</NextLink>
        </Button>
      </div>
    </div>
  );
}

export function BuildList({ projectID }: { projectID: string }) {
  useProjectEvents({ projectID });

  const { data: builds } = useQuery(
    queries.projects.detail(projectID)._ctx.listBuilds()
  );

  if (!builds?.length) {
    return <EmptyState id={projectID} />;
  }

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
              <NextLink
                className="absolute inset-0"
                href={`/builds/${build.id}`}
              >
                <span className="sr-only">Project page</span>
              </NextLink>
            </TableCell>
            <TableCell>{build.branch}</TableCell>
            <TableCell>{build.status}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
