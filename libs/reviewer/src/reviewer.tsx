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
import { BuildAPI, SnapshotTargetGroup, useReviewerStore } from "./store";
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
  // otherTargets?: {
  //   target: Snapshot["target"];
  //   id: Snapshot["id"];
  // }[];
};

export const snapshotSortMap: Record<Snapshot["status"], number> = {
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
  snapshots: Omit<ExtendedSnapshotPair, "otherTargets">[];
  optimize?: boolean;
  className?: string;
  buildAPI?: BuildAPI;
  userRole?: UserOnProjectRole;
  isUpdatingSnapshotStatus?: boolean;
}

const groupBy = <T, K extends keyof any>(list: T[], getKey: (item: T) => K) =>
  list.reduce((previous, currentItem) => {
    const group = getKey(currentItem);
    if (!previous[group]) previous[group] = [];
    previous[group].push(currentItem);
    return previous;
  }, {} as Record<K, T[]>);

const deepFind = <T, K extends keyof any>(list: T[][], comparator: (item: T) => boolean) => {
  for (const group of list) {
    const item = group.find(comparator);
    if (item) return item;
  }
}

const deepFindIndex = <T, K extends keyof any>(list: T[][], comparator: (item: T) => boolean) => {
  for (const [groupIndex, group] of list.entries()) {
    const itemIndex = group.findIndex(comparator);
    if (itemIndex !== -1) return [groupIndex, itemIndex];
  }
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

  const getGroupID = (snapshot: Snapshot) => `${snapshot.name}:${snapshot.variant}:${snapshot.viewport}`

  const snapshotTargetGroups = useMemo(
    () => Object.values(groupBy(snapshots, getGroupID)).flatMap((group) => {

      const groupedByStatus = groupBy(group, (snapshot) => snapshot.status);

      return Object.values(groupedByStatus).map((group) => ({
        name: group[0].name,
        variant: group[0].variant,
        viewport: group[0].viewport,
        snapshots: group,
        status: group[0].status
      } as SnapshotTargetGroup)
      )
    }),
    [snapshots]
  );

  useEffect(() => {
    if (snapshotTargetGroups.length > 0 && !currentSnapshot) {
      const snapshotId = searchParams.get("s");
      const group = snapshotTargetGroups.find((group) => group.snapshots.some((snapshot) => snapshot.id === snapshotId));
      setCurrentSnapshot(group?.snapshots.find((snapshot) => snapshot.id === snapshotId) || snapshotTargetGroups[0].snapshots[0]);
    }
  }, [
    setCurrentSnapshot,
    currentSnapshot,
    snapshotTargetGroups.length,
    snapshotTargetGroups,
    searchParams,
  ]);

  useEffect(() => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (currentSnapshot) params.set("s", currentSnapshot.id);

    router.replace(pathname + "?" + params.toString());
  }, [currentSnapshot, pathname, router, searchParams]);

  const currentSnapshotIndex = useMemo(() => {
    const index = snapshotTargetGroups.findIndex((group) => group.snapshots.some((snapshot) => snapshot.id === currentSnapshot?.id));
    return index !== -1 ? index : 0;
  }, [currentSnapshot, snapshotTargetGroups]);

  useHotkeys(
    "ctrl+ArrowDown",
    (e) => {
      setCurrentSnapshot(
        snapshotTargetGroups.at(
          Math.min(currentSnapshotIndex + 1, snapshotTargetGroups.length - 1)
        )?.snapshots[0]
      );
      e.preventDefault();
    },
    [currentSnapshotIndex, snapshotTargetGroups.length, snapshotTargetGroups]
  );

  useHotkeys(
    "ctrl+ArrowUp",
    (e) => {
      setCurrentSnapshot(
        snapshotTargetGroups.at(Math.max(currentSnapshotIndex - 1, 0))?.snapshots[0]
      );
      e.preventDefault();
    },
    [currentSnapshotIndex, setCurrentSnapshot, snapshotTargetGroups]
  );

  useEffect(() => {
    setBuild(build);
    setSnapshots(snapshotTargetGroups);
    setOptimize(optimize);
    if (buildAPI) setBuildAPI(buildAPI);
    if (userRole) setUserRole(userRole);
    setIsUpdatingSnapshotStatus(isUpdatingSnapshotStatus || false);
  }, [
    build,
    setBuild,
    setSnapshots,
    snapshotTargetGroups,
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
