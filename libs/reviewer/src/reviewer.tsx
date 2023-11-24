"use client";

import {
  Build,
  Snapshot,
  SnapshotPair,
  UserOnProjectRole,
} from "@pixeleye/api";
import { useHotkeys } from "react-hotkeys-hook";
import { Panel } from "./panel";
import { Sidebar } from "./sidebar";
import { BuildAPI, useReviewerStore } from "./store";
import { useEffect, useMemo, useTransition } from "react";
import { Compare } from "./compare";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { cx } from "class-variance-authority";
import { StaticImageData } from "next/image";

export type ExtendedSnapshotPair = Omit<
  SnapshotPair,
  "baselineURL" | "snapURL" | "diffURL"
> & {
  baselineURL?: StaticImageData | string;
  snapURL?: StaticImageData | string;
  diffURL?: StaticImageData | string;
};

const snapshotSortMap: Record<Snapshot["status"], number> = {
  unreviewed: 0,
  rejected: 1,
  approved: 2,
  missing_baseline: 3,
  orphaned: 4,
  unchanged: 5,
  failed: 6,
  aborted: 7,
  processing: 8,
};

export interface ReviewerProps {
  build: Build;
  snapshots: ExtendedSnapshotPair[];
  optimize?: boolean;
  className?: string;
  buildAPI?: BuildAPI;
  userRole?: UserOnProjectRole;
  isUpdatingSnapshotStatus?: boolean;
}

export function Reviewer({
  build,
  snapshots,
  optimize = false,
  className = "h-[calc(100vh-3rem-1px)]",
  buildAPI,
  userRole,
  isUpdatingSnapshotStatus,
}: ReviewerProps) {
  const setBuild = useReviewerStore((state) => state.setBuild);
  const setSnapshots = useReviewerStore((state) => state.setSnapshots);
  const setOptimize = useReviewerStore((state) => state.setOptimize);
  const setCurrentSnapshot = useReviewerStore(
    (state) => state.setCurrentSnapshot
  );
  const currentSnapshot = useReviewerStore((state) => state.currentSnapshot);
  const panelOpen = useReviewerStore((state) => state.panelOpen);
  const setBuildAPI = useReviewerStore((state) => state.setBuildAPI);
  const setUserRole = useReviewerStore((state) => state.setUserRole);
  const setIsUpdatingSnapshotStatus = useReviewerStore(
    (state) => state.setIsUpdatingStatus
  );

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const sortedSnapshots = useMemo(
    () =>
      snapshots.sort((a, b) => {
        return snapshotSortMap[a.status] - snapshotSortMap[b.status];
      }),
    [snapshots]
  );

  useEffect(() => {
    if (sortedSnapshots.length > 0 && !currentSnapshot) {
      const snapshotId = searchParams.get("s");
      const snapshot = sortedSnapshots.find((s) => s.id === snapshotId);
      setCurrentSnapshot(snapshot || sortedSnapshots[0]);
    }
  }, [
    setCurrentSnapshot,
    currentSnapshot,
    sortedSnapshots.length,
    sortedSnapshots,
    searchParams,
  ]);

  useEffect(() => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (currentSnapshot) params.set("s", currentSnapshot.id);

    router.replace(pathname + "?" + params.toString());
  }, [currentSnapshot, pathname, router, searchParams]);

  const currentSnapshotIndex = sortedSnapshots.findIndex(
    (s) => s.id === currentSnapshot?.id
  );

  useHotkeys(
    "ctrl+ArrowDown",
    (e) => {
      setCurrentSnapshot(
        sortedSnapshots.at(
          Math.min(currentSnapshotIndex + 1, sortedSnapshots.length - 1)
        )
      );
      e.preventDefault();
    },
    [currentSnapshotIndex, sortedSnapshots.length, sortedSnapshots]
  );

  useHotkeys(
    "ctrl+ArrowUp",
    (e) => {
      setCurrentSnapshot(
        sortedSnapshots.at(Math.max(currentSnapshotIndex - 1, 0))
      );
      e.preventDefault();
    },
    [currentSnapshotIndex, setCurrentSnapshot, sortedSnapshots]
  );

  useEffect(() => {
    setBuild(build);
    setSnapshots(sortedSnapshots);
    setOptimize(optimize);
    if (buildAPI) setBuildAPI(buildAPI);
    if (userRole) setUserRole(userRole);
    setIsUpdatingSnapshotStatus(isUpdatingSnapshotStatus || false);
  }, [
    build,
    setBuild,
    setSnapshots,
    sortedSnapshots,
    setOptimize,
    optimize,
    buildAPI,
    setBuildAPI,
    userRole,
    setUserRole,
    setIsUpdatingSnapshotStatus,
    isUpdatingSnapshotStatus,
  ]);

  return (
    <div className={cx("w-full flex", className)}>
      <Sidebar />
      {panelOpen && <Panel />}
      <Compare />
    </div>
  );
}
