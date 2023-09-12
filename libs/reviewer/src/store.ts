import { create } from "zustand";
import { Panel } from "./panel";
import { Build, UserOnProjectRole } from "@pixeleye/api";
import { ExtendedSnapshotPair } from "./reviewer";

export type CompareTab = "single" | "double";

export type SingleSnapshot = "baseline" | "head";

export interface BuildAPI {
  approveSnapshot: (id: string) => void;
  rejectSnapshot: (id: string) => void;
  approveAllSnapshots: () => void;
  approveRemainingSnapshots: () => void;
  rejectAllSnapshots: () => void;
  rejectRemainingSnapshots: () => void;
}

interface ReviewerState {
  panel: Panel;
  setPanel: (panel: Panel) => void;
  optimize: boolean;
  setOptimize: (optimize: boolean) => void;
  build: Build;
  setBuild: (build: Build) => void;
  snapshots: ExtendedSnapshotPair[];
  setSnapshots: (snapshots: ExtendedSnapshotPair[]) => void;
  currentSnapshot?: ExtendedSnapshotPair;
  setCurrentSnapshot: (snapshot?: ExtendedSnapshotPair) => void;
  showDiff: boolean;
  setShowDiff: (showDiff: boolean) => void;
  panelOpen: boolean;
  setPanelOpen: (panelOpen: (state: boolean) => boolean) => void;
  activeCompareTab: CompareTab;
  setActiveCompareTab: (activeCompareTab: CompareTab) => void;
  framerLoaded: boolean;
  setFramerLoaded: () => void;
  singleSnapshot: SingleSnapshot;
  setSingleSnapshot: (singleSnapshot: SingleSnapshot) => void;

  buildAPI: BuildAPI;
  setBuildAPI: (buildAPI: BuildAPI) => void;

  userRole: UserOnProjectRole;
  setUserRole: (userRole: UserOnProjectRole) => void;

  isUpdatingStatus: boolean;
  setIsUpdatingStatus: (isUpdatingStatus: boolean) => void;
}

const isBrowser = typeof window !== "undefined";

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
  currentSnapshot: undefined,
  setCurrentSnapshot: (currentSnapshot) => set({ currentSnapshot }),
  showDiff: true,
  setShowDiff: (showDiff) => set({ showDiff }),
  panelOpen: isBrowser && window?.innerWidth > 768,
  setPanelOpen: (panelOpen) =>
    set((state) => ({
      panelOpen: panelOpen(state.panelOpen),
    })),
  activeCompareTab: "double",
  setActiveCompareTab: (activeCompareTab) => set({ activeCompareTab }),
  framerLoaded: false,
  setFramerLoaded: () => set({ framerLoaded: true }),
  singleSnapshot: "head",
  setSingleSnapshot: (singleSnapshot) => set({ singleSnapshot }),

  buildAPI: {
    approveSnapshot: () => {},
    rejectSnapshot: () => {},
    approveAllSnapshots: () => {},
    rejectAllSnapshots: () => {},
    approveRemainingSnapshots: () => {},
    rejectRemainingSnapshots: () => {},
  },
  setBuildAPI: (buildAPI) => set({ buildAPI }),

  userRole: "viewer",
  setUserRole: (userRole) => set({ userRole }),

  isUpdatingStatus: false,
  setIsUpdatingStatus: (isUpdatingStatus) => set({ isUpdatingStatus }),
}));
