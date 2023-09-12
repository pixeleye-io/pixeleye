"use client";

import { API } from "@/libs";
import { queries } from "@/queries";
import { Project, Build } from "@pixeleye/api";
import { BuildAPI, ExtendedSnapshotPair, Reviewer } from "@pixeleye/reviewer";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface ReviewProps {
  project: Project;
  buildID: string;
}

export function Review({ buildID, project }: ReviewProps) {
  const { data: build } = useQuery(queries.builds.detail(buildID));

  const { data: snapshots } = useQuery(
    queries.builds.detail(buildID)._ctx.listSnapshots()
  );

  const queryClient = useQueryClient();

  const approveAll = useMutation({
    mutationFn: () =>
      API.post("/builds/{id}/review/approve/all", {
        params: {
          id: buildID,
        },
      }),
  });

  const approve = useMutation({
    mutationFn: (id: string) =>
      API.post("/builds/{id}/review/approve", {
        params: {
          id: buildID,
        },
        body: {
          snapshotIDs: [id],
        },
      }),
    onMutate: async (id: string) => {
      // Optimistically update the snapshots
      await queryClient.cancelQueries(
        queries.builds.detail(buildID)._ctx.listSnapshots()
      );

      const previousSnapshots = queryClient.getQueryData<
        ExtendedSnapshotPair[]
      >(queries.builds.detail(buildID)._ctx.listSnapshots().queryKey);

      queryClient.setQueryData<ExtendedSnapshotPair[]>(
        queries.builds.detail(buildID)._ctx.listSnapshots().queryKey,
        (old) => {
          return old?.map((snapshot) => {
            if (snapshot.id === id) {
              return {
                ...snapshot,
                status: "approved",
              };
            }

            return snapshot;
          });
        }
      );

      return { previousSnapshots };
    },
    onError: (_err, _variables, context) => {
      // Rollback to the previous value
      if (context?.previousSnapshots) {
        queryClient.setQueryData<ExtendedSnapshotPair[]>(
          queries.builds.detail(buildID)._ctx.listSnapshots().queryKey,
          context.previousSnapshots
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries(
        queries.builds.detail(buildID)._ctx.listSnapshots()
      );
    },
  });

  const reject = useMutation({
    mutationFn: (id: string) =>
      API.post("/builds/{id}/review/reject", {
        params: {
          id: buildID,
        },
        body: {
          snapshotIDs: [id],
        },
      }),
    onMutate: async (id: string) => {
      // Optimistically update the snapshots
      await queryClient.cancelQueries(
        queries.builds.detail(buildID)._ctx.listSnapshots()
      );

      const previousSnapshots = queryClient.getQueryData<
        ExtendedSnapshotPair[]
      >(queries.builds.detail(buildID)._ctx.listSnapshots().queryKey);

      queryClient.setQueryData<ExtendedSnapshotPair[]>(
        queries.builds.detail(buildID)._ctx.listSnapshots().queryKey,
        (old) => {
          return old?.map((snapshot) => {
            if (snapshot.id === id) {
              return {
                ...snapshot,
                status: "rejected",
              };
            }

            return snapshot;
          });
        }
      );

      return { previousSnapshots };
    },
    onError: (_err, _variables, context) => {
      // Rollback to the previous value
      if (context?.previousSnapshots) {
        queryClient.setQueryData<ExtendedSnapshotPair[]>(
          queries.builds.detail(buildID)._ctx.listSnapshots().queryKey,
          context.previousSnapshots
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries(
        queries.builds.detail(buildID)._ctx.listSnapshots()
      );
    },
  });

  const rejectAll = useMutation({
    mutationFn: () =>
      API.post("/builds/{id}/review/reject/all", {
        params: {
          id: buildID,
        },
      }),
  });

  const buildAPI: BuildAPI = {
    approveAllSnapshots: approveAll.mutate,
    approveSnapshot: approve.mutate,
    rejectAllSnapshots: rejectAll.mutate,
    rejectSnapshot: reject.mutate,
  };

  const isUpdatingSnapshotStatus =
    approve.isPending ||
    reject.isPending ||
    approveAll.isPending ||
    rejectAll.isPending;

  // In theory this should never happen since we're prefetching the build and snapshots
  if (!build || !snapshots) {
    return null;
  }

  return (
    <Reviewer
      build={build}
      snapshots={snapshots}
      userRole={project.role}
      buildAPI={buildAPI}
      isUpdatingSnapshotStatus={isUpdatingSnapshotStatus}
    />
  );
}
