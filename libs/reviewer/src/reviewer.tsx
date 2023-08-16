"use client";

import { Build, SnapshotPair } from "@pixeleye/api";

import { Panel } from "./panel";
import { Sidebar } from "./sidebar";
import { useReviewerStore } from "./store";
import { use, useEffect } from "react";

export interface ReviewerProps {
  build: Build;
  snapshots: SnapshotPair[];
  optimize?: boolean;
}

export function Reviewer({ build, snapshots, optimize = false }: ReviewerProps) {
  const setBuild = useReviewerStore((state) => state.setBuild);
  const setSnapshots = useReviewerStore((state) => state.setSnapshots);
  const setOptimize = useReviewerStore((state) => state.setOptimize);

  useEffect(() => {
    setBuild(build);
    setSnapshots(snapshots);
    setOptimize(optimize);
  }, [build, setBuild, setSnapshots, snapshots, setOptimize, optimize]);

  return (
    <div className="min-h-[calc(100vh)] w-full flex">
      <Sidebar />
      <Panel />
    </div>
  );
}
