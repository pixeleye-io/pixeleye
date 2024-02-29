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
import { BuildAPI, SnapshotTargetGroup, StoreContext, createStore } from "./store";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Compare } from "./compare";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { cx } from "class-variance-authority";
import { StaticImageData } from "next/image";
import { useStore } from "zustand";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"


export type ExtendedSnapshotPair = Omit<
  SnapshotPair,
  "baselineURL" | "snapURL" | "diffURL"
> & {
  baselineURL?: StaticImageData | string;
  snapURL?: StaticImageData | string;
  diffURL?: StaticImageData | string;
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
  defaultSidebarWidth?: number;
  defaultSidebarOpen?: boolean;
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
  className,
  buildAPI,
  userRole,
  defaultSidebarWidth = 20,
  isUpdatingSnapshotStatus,
  snapshotTargetGroups
}: ReviewerProps & {
  snapshotTargetGroups: SnapshotTargetGroup[];
}) {
  const store = useContext(StoreContext)!

  const setBuild = useStore(store, (state) => state.setBuild);
  const setSnapshots = useStore(store, (state) => state.setSnapshots);
  const setCurrentSnapshot = useStore(store,
    (state) => state.setCurrentSnapshot
  );
  const currentSnapshot = useStore(store, (state) => state.currentSnapshot);
  const setBuildAPI = useStore(store, (state) => state.setBuildAPI);
  const setUserRole = useStore(store, (state) => state.setUserRole);
  const setIsUpdatingSnapshotStatus = useStore(store,
    (state) => state.setIsUpdatingStatus
  );
  const setPanelOpen = useStore(store, (state) => state.setPanelOpen);


  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

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
    if (buildAPI) setBuildAPI(buildAPI);
    if (userRole) setUserRole(userRole);
    setIsUpdatingSnapshotStatus(isUpdatingSnapshotStatus || false);
  }, [build, buildAPI, isUpdatingSnapshotStatus, setBuild, setBuildAPI, setIsUpdatingSnapshotStatus, setSnapshots, setUserRole, snapshotTargetGroups, userRole]);

  const showSidebar = useStore(store, (state) => state.panelOpen);
  const [collapsed, setCollapsed] = useState(false)
  const [width, setWidth] = useState(defaultSidebarWidth)

  const onLayout = (sizes: number[]) => {
    if (sizes.length > 1) {
      document.cookie = `reviewer-sidebar-width=${sizes[0]}; path=/; max-age=31536000`;
      setWidth(sizes[0])
    }
  };


  return (
    <div className={cx("w-full flex", className)}>
      <Sidebar />
      <PanelMobile />
      <PanelGroup onLayout={onLayout} direction="horizontal">
        {
          showSidebar && (<>
            <Panel collapsible={true} onResize={(size) => setCollapsed(size === 0)} collapsedSize={0} className="hidden lg:block" order={1} defaultSize={width} minSize={15} maxSize={30}>
              <PanelDesktop />
            </Panel>
            <PanelResizeHandle onDragging={(dragging) => !dragging && collapsed && setPanelOpen(() => false)} className="bg-outline-variant data-[resize-handle-state=drag]:bg-outline data-[resize-handle-state=hover]:bg-outline w-0.5 hidden lg:block" />
          </>
          )}
        <Panel defaultSize={showSidebar ? 100 - defaultSidebarWidth : 100} order={2} className="w-full">
          <Compare />
        </Panel>
        <PanelResizeHandle />
      </PanelGroup>
    </div>
  );
}


export function Reviewer(props: ReviewerProps) {

  const getGroupID = (snapshot: Snapshot) => `${snapshot.name}:${snapshot.variant}:${snapshot.viewport}`


  const searchParams = useSearchParams();

  const snapshotTargetGroups = useMemo(
    () => Object.values(groupBy(props.snapshots, getGroupID)).flatMap((group) => {

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
    [props.snapshots]
  );

  const snapshotId = searchParams.get("s");
  const group = snapshotTargetGroups.find((group) => group.snapshots.some((snapshot) => snapshot.id === snapshotId));

  const store = useRef(createStore({
    panelOpen: props.defaultSidebarOpen,
    currentSnapshot: group?.snapshots.find((snapshot) => snapshot.id === snapshotId) || snapshotTargetGroups[0].snapshots[0],
    optimize: props.optimize,
    snapshots: snapshotTargetGroups,
    build: props.build,
    userRole: props.userRole
  })).current

  return (
    <StoreContext.Provider value={store}>
      <ReviewerInternal snapshotTargetGroups={snapshotTargetGroups} {...props} />
    </StoreContext.Provider>
  )
}