import { create } from "zustand";
import { Panel } from "./panel";
import { Build, Snapshot } from "@pixeleye/api";

interface ReviewerState {
  panel: Panel;
  setPanel: (panel: Panel) => void;
  build: Build;
  setBuild: (build: Build) => void;
  snapshots: Snapshot[];
  setSnapshots: (snapshots: Snapshot[]) => void;
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
  build: defaultBuild,
  setBuild: (build) => set({ build }),
  snapshots: [],
  setSnapshots: (snapshots) => set({ snapshots }),
}));
