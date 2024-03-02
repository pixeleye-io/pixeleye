"use client";

import { queries } from "@/queries";
import { Build } from "@pixeleye/api";
import {
  InfiniteData,
  QueryClient,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";
import { BACKEND_URL, env } from "../env";
import { useBackendURL } from "@/app/providers";

interface ProjectEvent {
  projectID: string;
}

type BuildStatusEventData = {
  type: "build_status";
  data: {
    buildID: string;
    status: Build["status"];
  };
};

type NewBuildEventData = {
  type: "new_build";
  data: Build;
};

type ProjectEventData = BuildStatusEventData | NewBuildEventData;

function updateBuildStatus(
  queryClient: QueryClient,
  projectID: string,
  data: BuildStatusEventData
) {
  const cachedBuilds = queryClient.getQueryData<Build[]>(
    queries.projects.detail(projectID)._ctx.listBuilds().queryKey
  );

  const cachedInfiniteBuilds = queryClient.getQueryData([
    ...queries.projects.detail(projectID)._ctx.listBuilds().queryKey,
    "infinite",
  ]) as InfiniteData<Build[]> | undefined;

  if (cachedBuilds) {
    const buildIndex = cachedBuilds.findIndex(
      (build: any) => build.id === data.data.buildID
    );
    if (buildIndex === -1) {
      queryClient.invalidateQueries(
        queries.projects.detail(projectID)._ctx.listBuilds()
      );
    } else {
      queryClient.setQueryData(
        queries.projects.detail(projectID)._ctx.listBuilds().queryKey,
        [
          ...cachedBuilds.slice(0, buildIndex),
          {
            ...cachedBuilds[buildIndex],
            status: data.data.status,
          },
          ...cachedBuilds.slice(buildIndex + 1),
        ]
      );
    }
  }

  if (cachedInfiniteBuilds) {
    const pageIndex = cachedInfiniteBuilds.pages.findIndex((page) =>
      page.find((build) => build.id === data.data.buildID)
    );

    if (pageIndex === -1) {
      queryClient.invalidateQueries(
        queries.projects.detail(projectID)._ctx.listBuilds()
      );
    } else {
      const buildIndex = cachedInfiniteBuilds.pages[pageIndex].findIndex(
        (build) => build.id === data.data.buildID
      );

      if (buildIndex === -1) {
        queryClient.invalidateQueries(
          queries.projects.detail(projectID)._ctx.listBuilds()
        );
      } else {
        queryClient.setQueryData<InfiniteData<Build[]>>(
          [
            ...queries.projects.detail(projectID)._ctx.listBuilds().queryKey,
            "infinite",
          ],
          (prev) => ({
            pages: [
              ...cachedInfiniteBuilds.pages.slice(0, pageIndex),
              [
                ...cachedInfiniteBuilds.pages[pageIndex].slice(0, buildIndex),
                {
                  ...cachedInfiniteBuilds.pages[pageIndex][buildIndex],
                  status: data.data.status,
                },
                ...cachedInfiniteBuilds.pages[pageIndex].slice(buildIndex + 1),
              ],
              ...cachedInfiniteBuilds.pages.slice(pageIndex + 1),
            ],
            pageParams: prev?.pageParams || [],
          })
        );
      }
    }
  }

  const cachedBuild = queryClient.getQueryData<Build>(
    queries.builds.detail(data.data.buildID).queryKey
  );
  if (cachedBuild) {
    queryClient.setQueryData(
      queries.builds.detail(data.data.buildID).queryKey,
      {
        ...cachedBuild,
        status: data.data.status,
      }
    );
    queryClient.invalidateQueries(queries.builds.detail(data.data.buildID));
  }
}

function newBuild(
  queryClient: QueryClient,
  projectID: string,
  data: NewBuildEventData
) {
  const cachedBuilds =
    queryClient.getQueryData<Build[]>(
      queries.projects.detail(projectID)._ctx.listBuilds().queryKey
    ) || [];

  const cachedInfiniteBuilds = queryClient.getQueryData([
    ...queries.projects.detail(projectID)._ctx.listBuilds().queryKey,
    "infinite",
  ]) as InfiniteData<Build[]> | undefined;

  queryClient.setQueryData(
    queries.projects.detail(projectID)._ctx.listBuilds().queryKey,
    [data.data, ...cachedBuilds]
  );
  queryClient.setQueryData<InfiniteData<Build[]>>(
    [
      ...queries.projects.detail(projectID)._ctx.listBuilds().queryKey,
      "infinite",
    ],
    (prev) => ({
      pages: [
        [data.data, ...(cachedInfiniteBuilds?.pages[0] || [])],
        ...(cachedInfiniteBuilds?.pages.slice(1) || []),
      ],
      pageParams: prev?.pageParams || [],
    })
  );

  queryClient.setQueryData(
    queries.builds.detail(data.data.id).queryKey,
    data.data
  );
}

export function useProjectEvents({ projectID }: ProjectEvent) {
  const queryClient = useQueryClient();

  const backendURL = useBackendURL((state) => state.backendURL) || BACKEND_URL!;

  useEffect(() => {
    const eventSource = new EventSource(
      `${backendURL}/v1/projects/${projectID}/events`,
      {
        withCredentials: true,
      }
    );

    const listener = (event: MessageEvent) => {
      const data: ProjectEventData = JSON.parse(event.data);

      switch (data.type) {
        case "build_status":
          updateBuildStatus(queryClient, projectID, data);
          break;
        case "new_build":
          newBuild(queryClient, projectID, data);
          break;
      }
    };

    eventSource.addEventListener("message", listener);

    return () => {
      eventSource.removeEventListener("message", listener);
      eventSource.close();
    };
  }, [projectID, queryClient]);
}
