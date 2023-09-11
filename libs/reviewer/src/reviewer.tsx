"use client";

import { Build, SnapshotPair } from "@pixeleye/api";
import { useHotkeys } from "react-hotkeys-hook";
import { Panel } from "./panel";
import { Sidebar } from "./sidebar";
import { BuildAPI, useReviewerStore } from "./store";
import { useEffect, useTransition } from "react";
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

export interface ReviewerProps {
  build: Build;
  snapshots: ExtendedSnapshotPair[];
  optimize?: boolean;
  className?: string;
  buildAPI?: BuildAPI;
}

export function Reviewer({
  build,
  snapshots,
  optimize = false,
  className = "h-[calc(100vh-3rem-1px)]",
  buildAPI,
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

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (snapshots.length > 0 && !currentSnapshot) {
      const snapshotId = searchParams.get("s");
      const snapshot = snapshots.find((s) => s.id === snapshotId);
      setCurrentSnapshot(snapshot || snapshots[0]);
    }
  }, [
    setCurrentSnapshot,
    currentSnapshot,
    snapshots.length,
    snapshots,
    searchParams,
  ]);

  useEffect(() => {
    if (buildAPI) setBuildAPI(buildAPI);
  }, [buildAPI, setBuildAPI]);

  useEffect(() => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (currentSnapshot) params.set("s", currentSnapshot.id);

    router.replace(pathname + "?" + params.toString());
  }, [currentSnapshot, pathname, router, searchParams]);

  const currentSnapshotIndex = snapshots.findIndex(
    (s) => s.id === currentSnapshot?.id
  );

  useHotkeys(
    "ctrl+ArrowDown",
    (e) => {
      setCurrentSnapshot(
        snapshots.at(Math.min(currentSnapshotIndex + 1, snapshots.length - 1))
      );
      e.preventDefault();
    },
    [currentSnapshotIndex, snapshots.length, snapshots]
  );

  useHotkeys(
    "ctrl+ArrowUp",
    (e) => {
      setCurrentSnapshot(snapshots.at(Math.max(currentSnapshotIndex - 1, 0)));
      e.preventDefault();
    },
    [currentSnapshotIndex, setCurrentSnapshot, snapshots]
  );

  useEffect(() => {
    setBuild(build);
    setSnapshots(snapshots);
    setOptimize(optimize);
  }, [build, setBuild, setSnapshots, snapshots, setOptimize, optimize]);

  return (
    <div className={cx("w-full flex", className)}>
      <Sidebar />
      {panelOpen && <Panel />}
      <Compare />
    </div>
  );
}
