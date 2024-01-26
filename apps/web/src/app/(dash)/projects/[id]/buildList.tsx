"use client";

import { API, useProjectEvents } from "@/libs";
import { queries } from "@/queries";
import dayjs from "dayjs";
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Status
} from "@pixeleye/ui";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import NextLink from "next/link";
import { SecuritySection } from "./manage/sections";
import { ChevronRightIcon, EllipsisVerticalIcon } from "@heroicons/react/24/solid";
import { Build } from "@pixeleye/api";
import relativeTime from "dayjs/plugin/relativeTime";
import { cx } from "class-variance-authority";
import { CalendarDaysIcon } from "@heroicons/react/16/solid";
import React from "react";

dayjs.extend(relativeTime);


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

const buildStatuses: Record<Build["status"], string> = {
  "aborted": "Aborted",
  "failed": "Failed",
  "processing": "Processing",
  "queued-processing": "Queued processing",
  "queued-uploading": "Queued uploading",
  "uploading": "Uploading",
  approved: "Approved",
  orphaned: "Orphaned",
  rejected: "Rejected",
  unchanged: "Unchanged",
  unreviewed: "Unreviewed",
};


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
    <li className="">
      <div className="relative flex items-center space-x-4 py-4 rounded px-2 z-0 [&:hover:not(:has(button:hover))]:bg-surface-container">
        <div className="min-w-0 flex-[2_2_0%]">
          <div className="flex items-center gap-x-3">
            <Status status={build.status} />
            <h2 className="min-w-0 text-sm font-semibold leading-6 text-on-surface">
              <NextLink href={`/builds/${build.id}`} className="flex gap-x-2 ">
                <span className="whitespace-nowrap">{buildStatuses[build.status]}</span>
                <span className="text-outline">/</span>
                <span className="whitespace-nowrap text-on-surface-variant truncate">{build.title || "some build title adsf sdafads fdasf dasf dasf dasf ads fads fdas fsa f"}</span>
                <span className="absolute inset-0" />
              </NextLink>
            </h2>
          </div>
          <div className="mt-3 flex items-center gap-x-2.5 text-xs leading-5 text-on-surface-variant">
            <p className="truncate">#{build.buildNumber}</p>
            <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 flex-none fill-outline">
              <circle cx={1} cy={1} r={1} />
            </svg>
            <div className="flex items-center space-x-1">
              <CalendarDaysIcon className="h-4 w-4" />
              <p className="whitespace-nowrap"> {dayjs(build.createdAt).fromNow()}</p>
            </div>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center ">
            <span className="text-xs text-blue-600 min-w-0 bg-blue-50 font-semibold dark:bg-blue-900/25 dark:text-blue-300 ring-blue-600/20 rounded px-2 py-1 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 512 512" fill="currentColor">
                <path d="M306 2c8 4 14 13 14 22v40h16c71 0 128 57 128 128v167a80 80 0 1 1-64 0V192c0-35-29-64-64-64h-16v40a24 24 0 0 1-40 18l-80-72c-5-5-8-11-8-18s3-13 8-18l80-72c7-6 17-8 26-4zM104 80a24 24 0 1 0-48 0 24 24 0 1 0 48 0zm8 73v206a80 80 0 1 1-64 0V153a80 80 0 1 1 64 0zm-8 279a24 24 0 1 0-48 0 24 24 0 1 0 48 0zm328 24a24 24 0 1 0 0-48 24 24 0 1 0 0 48z" />
              </svg>
              <span className="truncate min-w-0">
                {build.branch}
              </span>
            </span>
          </div>
        </div>
        {
          ["processing", "uploading", "queued-processing", "queued-uploading"].includes(build.status) ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="z-10">
                  <EllipsisVerticalIcon className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => abortBuild.mutate()}>
                  Cancel build
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <ChevronRightIcon className="h-5 w-5 text-on-surface-variant" />
          )
        }

      </div>
    </li>
  );
}

export function BuildList({ projectID }: { projectID: string }) {
  useProjectEvents({ projectID });


  const { data: buildsData, status, isFetchingNextPage, fetchNextPage, hasNextPage } = useInfiniteQuery(
    {
      queryKey: [
        ...queries.projects.detail(projectID)._ctx.listBuilds().queryKey,
        "infinite",
      ], queryFn: ({ pageParam }: { pageParam: number }) => API.get("/v1/projects/{id}/builds", {
        params: {
          id: projectID,
        },
        queries: {
          limit: 25,
          offset: pageParam,
        }
      }), getNextPageParam: (_, pages, lastPageParam) => {
        const count = pages.reduce((prev, curr) => prev + curr.length, 0);

        return count === lastPageParam ? undefined : count;
      }, initialPageParam: 0,

    }
  );

  if (status === "pending") return undefined;

  if (!buildsData?.pages.reduce((prev, curr) => prev + curr.length, 0)) {
    return <EmptyState id={projectID} />;
  }


  return (
    <div>
      <div>
      </div>
      <ul role="list" className="divide-y divide-outline-variant">
        {buildsData.pages.map((group, i) => (

          <React.Fragment key={i}>
            {
              group?.map((build) => (
                <BuildRow key={build.id} build={build} />
              ))}

          </React.Fragment>


        ))}
      </ul>
      <div className="flex items-center justify-center">
        <Button
          variant="outline"
          className="my-8"
          onClick={() => fetchNextPage()}
          loading={isFetchingNextPage}
          disabled={!hasNextPage || isFetchingNextPage}
        >
          {hasNextPage
            ? 'Load More'
            : 'Nothing more to load'}
        </Button>
      </div>
    </div>
  );
}
