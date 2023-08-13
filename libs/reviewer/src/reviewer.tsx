"use client";

import { Build, Snapshot } from "@pixeleye/api";

import { Panel } from "./panel";
import { Sidebar } from "./sidebar";
import { useReviewerStore } from "./store";
import { use, useEffect } from "react";

export interface ReviewerProps {
  build: Build;
  snapshots: Snapshot[];
}

export function Reviewer({ build, snapshots }: ReviewerProps) {
  const setBuild = useReviewerStore((state) => state.setBuild);
  const setSnapshots = useReviewerStore((state) => state.setSnapshots);

  useEffect(() => {
    setBuild(build);
    setSnapshots(snapshots);
  }, [build, setBuild, setSnapshots, snapshots]);

  return (
    <div className="min-h-[calc(100vh)] w-full flex">
      <Sidebar />
      <Panel />
    </div>
  );
}
