"use client";

import {
  Build,
  Snapshot,
  SnapshotPair,
  UserOnProjectRole,
} from "@pixeleye/api";
import { useHotkeys } from "react-hotkeys-hook";
import { PanelMobile, PanelDesktop } from "./panel";
import { Sidebar } from "./sidebar";
import { BuildAPI, SnapshotTargetGroup, StoreContext, store } from "./store";
import { useContext, useEffect, useMemo, useTransition } from "react";
import { Compare } from "./compare";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { cx } from "class-variance-authority";
import { StaticImageData } from "next/image";
import { useStore } from "zustand";


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




function ReviewerInternal({
  build,
  snapshots,
  optimize = false,
  className = "h-[calc(100vh-3rem-1px)]",
  buildAPI,
  userRole,
  isUpdatingSnapshotStatus,
}: ReviewerProps) {
  const store = useContext(StoreContext)

  const setBuild = useStore(store, (state) => state.setBuild);
  const setSnapshots = useStore(store, (state) => state.setSnapshots);
  const setOptimize = useStore(store, (state) => state.setOptimize);
  const setCurrentSnapshot = useStore(store,
    (state) => state.setCurrentSnapshot
  );
  const currentSnapshot = useStore(store, (state) => state.currentSnapshot);
  const setBuildAPI = useStore(store, (state) => state.setBuildAPI);
  const setUserRole = useStore(store, (state) => state.setUserRole);
  const setIsUpdatingSnapshotStatus = useStore(store,
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
        snapshots: group.sort((a, b) => (a.target || "").localeCompare(b.target || "")),
        status: group[0].status
      } as SnapshotTargetGroup)
      )
    }).sort((a, b) => snapshotSortMap[a.status] - snapshotSortMap[b.status]),
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
    if (currentSnapshot) {
      if (!snapshots.some((snapshot) => snapshot.id === currentSnapshot.id)) {
        setCurrentSnapshot(snapshotTargetGroups[0].snapshots[0]);
        return;
      }
      params.set("s", currentSnapshot.id);
    }

    router.replace(pathname + "?" + params.toString());
  }, [currentSnapshot, pathname, router, searchParams, setCurrentSnapshot, snapshotTargetGroups, snapshots]);

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
      <PanelMobile />
      <PanelDesktop />
      <Compare />
    </div>
  );
}


export function Reviewer(props: ReviewerProps) {

  return (
    <StoreContext.Provider value={store}>
      <ReviewerInternal {...props} />
    </StoreContext.Provider>
  )
}