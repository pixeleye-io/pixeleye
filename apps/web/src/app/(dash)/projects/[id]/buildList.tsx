"use client";

import { API, useProjectEvents } from "@/libs";
import { queries } from "@/queries";
import {
  Table,
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@pixeleye/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import NextLink from "next/link";
import { SecuritySection } from "./manage/sections";
import { EllipsisVerticalIcon } from "@heroicons/react/24/solid";
import build from "next/dist/build";
import { Build } from "@pixeleye/api";

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

function BuildRow({ build }: { build: Build }) {
  const queryClient = useQueryClient();

  const abortBuild = useMutation({
    mutationFn: () =>
      API.post("/v1/builds/{id}/review/abort", {
        params: {
          id: build.id,
        },
      }),

    onMutate: async () => {
      await queryClient.cancelQueries(queries.builds.detail(build.id));
      await queryClient.cancelQueries(
        queries.projects.detail(build.projectID)._ctx.listBuilds()
      );

      const previousBuild = queryClient.getQueryData<Build>(
        queries.builds.detail(build.id).queryKey
      );

      const previousBuilds = queryClient.getQueryData<Build[]>(
        queries.projects.detail(build.projectID)._ctx.listBuilds().queryKey
      );

      queryClient.setQueryData<Build>(
        queries.builds.detail(build.id).queryKey,
        (old) =>
          old
            ? {
              ...old,
              status: "aborted",
            }
            : undefined
      );

      queryClient.setQueryData<Build[]>(
        queries.projects.detail(build.projectID)._ctx.listBuilds().queryKey,
        (old) =>
          old?.map((b) => {
            if (b.id === build.id) {
              return {
                ...b,
                status: "aborted",
              };
            }

            return b;
          })
      );

      return { previousBuild, previousBuilds };
    },
    onError: (_err, _variables, context) => {
      // Rollback to the previous value
      if (context?.previousBuild) {
        queryClient.setQueryData<Build>(
          queries.builds.detail(build.id).queryKey,
          context.previousBuild
        );
      }
      if (context?.previousBuilds) {
        queryClient.setQueryData<Build[]>(
          queries.projects.detail(build.projectID)._ctx.listBuilds().queryKey,
          context.previousBuilds
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries(queries.builds.detail(build.id));
      queryClient.invalidateQueries(
        queries.projects.detail(build.projectID)._ctx.listBuilds()
      );
    },
  });

  return (
    <Table.Row key={build.id} className="relative cursor-pointer z-0 h-[4.25rem]">
      <Table.Cell className="font-medium">
        Build #{build.buildNumber}
        <NextLink className="absolute inset-0" href={`/builds/${build.id}`}>
          <span className="sr-only">Project page</span>
        </NextLink>
      </Table.Cell>
      <Table.Cell>{build.branch}</Table.Cell>
      <Table.Cell>{build.status}</Table.Cell>
      {[
        "uploading",
        "queued-uploading",
        "processing",
        "queued-processing",
      ].includes(build.status) ? (
        <Table.Cell className="w-20">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <EllipsisVerticalIcon className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => abortBuild.mutate()}>
                Cancel build
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Table.Cell>
      ) : (
        <Table.Cell className="w-20" />)}
    </Table.Row>
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
      <Table.Header>
        <Table.Row>
          <Table.Head>Name</Table.Head>
          <Table.Head>Branch</Table.Head>
          <Table.Head>Status</Table.Head>
          <Table.Head>
            <span className="sr-only">Actions</span>
          </Table.Head>

        </Table.Row>
      </Table.Header>
      <Table.Body>
        {builds?.map((build) => <BuildRow key={build.id} build={build} />)}
      </Table.Body>
    </Table>
  );
}
