"use client";

import { queries } from "@/queries";
import { Build } from "@pixeleye/api";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { env } from "../env";

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
    queryClient.invalidateQueries(
      queries.builds.detail(data.data.buildID)
    );
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

  queryClient.setQueryData(
    queries.projects.detail(projectID)._ctx.listBuilds().queryKey,
    [data.data, ...cachedBuilds]
  );
  queryClient.setQueryData(
    queries.builds.detail(data.data.id).queryKey,
    data.data
  );
}

export function useProjectEvents({ projectID }: ProjectEvent) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const eventSource = new EventSource(
      `${env.NEXT_PUBLIC_BACKEND_URL}/v1/projects/${projectID}/events`,
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
