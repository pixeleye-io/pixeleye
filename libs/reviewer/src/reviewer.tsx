"use client";

import { Build, SnapshotPair } from "@pixeleye/api";
import { useHotkeys } from "react-hotkeys-hook";
import { Panel } from "./panel";
import { Sidebar } from "./sidebar";
import { useReviewerStore } from "./store";
import { useEffect } from "react";
import { Compare } from "./compare";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

export interface ReviewerProps {
  build: Build;
  snapshots: SnapshotPair[];
  optimize?: boolean;
}

export function Reviewer({
  build,
  snapshots,
  optimize = false,
}: ReviewerProps) {
  const setBuild = useReviewerStore((state) => state.setBuild);
  const setSnapshots = useReviewerStore((state) => state.setSnapshots);
  const setOptimize = useReviewerStore((state) => state.setOptimize);
  const setCurrentSnapshot = useReviewerStore(
    (state) => state.setCurrentSnapshot
  );
  const currentSnapshot = useReviewerStore((state) => state.currentSnapshot);
  const panelOpen = useReviewerStore((state) => state.panelOpen);

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
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (currentSnapshot) params.set("s", currentSnapshot.id);

    router.replace(pathname + "?" + params.toString());
  }, [currentSnapshot, pathname, router, searchParams]);

  const currentSnapshotIndex = snapshots.findIndex(
    (s) => s.id === currentSnapshot?.id
  );

  useHotkeys(
    "ctrl+ArrowDown",
    () =>
      setCurrentSnapshot(
        snapshots.at(Math.min(currentSnapshotIndex + 1, snapshots.length - 1))
      ),
    [currentSnapshotIndex, snapshots.length, snapshots]
  );

  useHotkeys(
    "ctrl+ArrowUp",
    () =>
      setCurrentSnapshot(snapshots.at(Math.max(currentSnapshotIndex - 1, 0))),
    [currentSnapshotIndex, setCurrentSnapshot, snapshots]
  );

  useEffect(() => {
    setBuild(build);
    setSnapshots(snapshots);
    setOptimize(optimize);
  }, [build, setBuild, setSnapshots, snapshots, setOptimize, optimize]);

  return (
    <div className="h-[calc(100vh-3rem-1px)] w-full flex">
      <Sidebar />
      {panelOpen && <Panel />}
      <Compare />
    </div>
  );
}
