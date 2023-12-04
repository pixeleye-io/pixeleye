"use client";

import { API } from "@/libs";
import { queries } from "@/queries";
import { Project, Build } from "@pixeleye/api";
import { BuildAPI, ExtendedSnapshotPair, Reviewer } from "@pixeleye/reviewer";
import {
  UseMutationOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

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

  const reviewSingleOptimisticUpdate = (
    status: ExtendedSnapshotPair["status"]
  ) =>
    ({
      onMutate: async (ids) => {
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
              if (ids.includes(snapshot.id)) {
                return {
                  ...snapshot,
                  status,
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
    }) as Pick<
      UseMutationOptions<
        unknown,
        unknown,
        string[],
        {
          previousSnapshots: ExtendedSnapshotPair[];
        }
      >,
      "onError" | "onSettled" | "onMutate"
    >;

  const reviewAllOptimisticUpdate = (
    status: ExtendedSnapshotPair["status"],
    matching: ExtendedSnapshotPair["status"][]
  ) =>
    ({
      onMutate: async () => {
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
              if (matching.includes(snapshot.status)) {
                return {
                  ...snapshot,
                  status,
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
    }) as Pick<
      UseMutationOptions<
        unknown,
        unknown,
        void,
        {
          previousSnapshots: ExtendedSnapshotPair[];
        }
      >,
      "onError" | "onSettled" | "onMutate"
    >;

  const approveAll = useMutation({
    mutationFn: () =>
      API.post("/v1/builds/{id}/review/approve/all", {
        params: {
          id: buildID,
        },
      }),
    ...reviewAllOptimisticUpdate("approved", [
      "approved",
      "rejected",
      "unreviewed",
    ]),
  });

  const approveRemaining = useMutation({
    mutationFn: () =>
      API.post("/v1/builds/{id}/review/approve/remaining", {
        params: {
          id: buildID,
        },
      }),
    ...reviewAllOptimisticUpdate("approved", ["unreviewed"]),
  });

  const approve = useMutation({
    mutationFn: (snapshotIDs: string[]) =>
      API.post("/v1/builds/{id}/review/approve", {
        params: {
          id: buildID,
        },
        body: {
          snapshotIDs,
        },
      }),
    ...reviewSingleOptimisticUpdate("rejected"),
  });

  const reject = useMutation({
    mutationFn: (snapshotIDs: string[]) =>
      API.post("/v1/builds/{id}/review/reject", {
        params: {
          id: buildID,
        },
        body: {
          snapshotIDs,
        },
      }),
    ...reviewSingleOptimisticUpdate("rejected"),
  });

  const rejectAll = useMutation({
    mutationFn: () =>
      API.post("/v1/builds/{id}/review/reject/all", {
        params: {
          id: buildID,
        },
      }),
    ...reviewAllOptimisticUpdate("rejected", [
      "approved",
      "rejected",
      "unreviewed",
    ]),
  });

  const rejectRemaining = useMutation({
    mutationFn: () =>
      API.post("/v1/builds/{id}/review/reject/remaining", {
        params: {
          id: buildID,
        },
      }),
    ...reviewAllOptimisticUpdate("rejected", ["unreviewed"]),
  });

  const buildAPI: BuildAPI = {
    approveAllSnapshots: approveAll.mutate,
    approveSnapshots: approve.mutate,
    approveRemainingSnapshots: approveRemaining.mutate,
    rejectAllSnapshots: rejectAll.mutate,
    rejectSnapshots: reject.mutate,
    rejectRemainingSnapshots: rejectRemaining.mutate,
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
