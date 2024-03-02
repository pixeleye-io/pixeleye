"use client";

import { queries } from "@/queries";
import { Build } from "@pixeleye/api";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { BACKEND_URL, env } from "../env";
import { useBackendURL } from "@/app/providers";

interface BuildEvent {
  buildID: string;
}

type BuildStatusEventData = {
  type: "build_status";
  data: {
    buildID: string;
    status: Build["status"];
    projectID: string;
  };
};

type NewBuildEventData = {
  type: "new_build";
  data: Build;
};

type ProjectEventData = BuildStatusEventData | NewBuildEventData;

function updateBuildStatus(
  queryClient: QueryClient,
  { data }: BuildStatusEventData
) {
  const cachedBuilds = queryClient.getQueryData<Build[]>(
    queries.projects.detail(data.projectID)._ctx.listBuilds().queryKey
  );
  if (cachedBuilds) {
    const buildIndex = cachedBuilds.findIndex(
      (build: any) => build.id === data.buildID
    );
    if (buildIndex === -1) {
      queryClient.invalidateQueries(
        queries.projects.detail(data.projectID)._ctx.listBuilds()
      );
    } else {
      queryClient.setQueryData(
        queries.projects.detail(data.projectID)._ctx.listBuilds().queryKey,
        [
          ...cachedBuilds.slice(0, buildIndex),
          {
            ...cachedBuilds[buildIndex],
            status: data.status,
          },
          ...cachedBuilds.slice(buildIndex + 1),
        ]
      );
    }
  }

  const cachedBuild = queryClient.getQueryData<Build>(
    queries.builds.detail(data.buildID).queryKey
  );
  if (cachedBuild) {
    queryClient.setQueryData(queries.builds.detail(data.buildID).queryKey, {
      ...cachedBuild,
      status: data.status,
    });
    queryClient.invalidateQueries(queries.builds.detail(data.buildID));
  }
}

export function useBuildEvents({ buildID }: BuildEvent) {
  const queryClient = useQueryClient();

  const backendURL = useBackendURL((state) => state.backendURL) || BACKEND_URL!;

  useEffect(() => {
    const eventSource = new EventSource(
      `${backendURL}/v1/builds/${buildID}/events`,
      {
        withCredentials: true,
      }
    );

    const listener = (event: MessageEvent) => {
      const data: ProjectEventData = JSON.parse(event.data);

      switch (data.type) {
        case "build_status":
          updateBuildStatus(queryClient, data);
          break;
      }
    };

    eventSource.addEventListener("message", listener);

    return () => {
      eventSource.removeEventListener("message", listener);
      eventSource.close();
    };
  }, [buildID, queryClient]);
}
