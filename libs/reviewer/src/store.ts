import { create } from "zustand";
import { Panel } from "./panel";
import { Build, SnapshotPair } from "@pixeleye/api";

interface ReviewerState {
  panel: Panel;
  setPanel: (panel: Panel) => void;
  optimize: boolean;
  setOptimize: (optimize: boolean) => void;
  build: Build;
  setBuild: (build: Build) => void;
  snapshots: SnapshotPair[];
  setSnapshots: (snapshots: SnapshotPair[]) => void;
}

const defaultBuild: Build = {
  id: "",
  branch: "",
  sha: "",
  createdAt: "",
  updatedAt: "",
  buildNumber: 0,
  errors: [],
  projectID: "",
  status: "uploading",
};

export const useReviewerStore = create<ReviewerState>()((set) => ({
  panel: "snapshots",
  setPanel: (panel) => set({ panel }),
  optimize: false,
  setOptimize: (optimize) => set({ optimize }),
  build: defaultBuild,
  setBuild: (build) => set({ build }),
  snapshots: [],
  setSnapshots: (snapshots) => set({ snapshots }),
}));
