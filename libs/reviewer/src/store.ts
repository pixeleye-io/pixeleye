"use client";

import { create, createStore as createZustandStore } from "zustand";
import { Panel } from "./panel";
import { Build, UserOnProjectRole } from "@pixeleye/api";
import { ExtendedSnapshotPair } from "./reviewer";
import { createContext } from "react";

export type CompareTab = "single" | "double";

export type SingleSnapshot = "baseline" | "head";

export interface BuildAPI {
  approveSnapshots: (ids: string[]) => void;
  rejectSnapshots: (ids: string[]) => void;
  approveAllSnapshots: () => void;
  approveRemainingSnapshots: () => void;
  rejectAllSnapshots: () => void;
  rejectRemainingSnapshots: () => void;
}

export type DiffGroupedSnapshotTargetGroups = {
  status: ExtendedSnapshotPair["status"];
  targetGroups: SnapshotTargetGroup[];
};

export type SnapshotTargetGroup = {
  snapshots: ExtendedSnapshotPair[];
  name: ExtendedSnapshotPair["name"];
  variant: ExtendedSnapshotPair["variant"];
  viewport: ExtendedSnapshotPair["viewport"];
  status: ExtendedSnapshotPair["status"];
};

interface ReviewerState {
  panel: Panel;
  setPanel: (panel: Panel) => void;
  optimize: boolean;
  build: Build;
  setBuild: (build: Build) => void;
  snapshots: DiffGroupedSnapshotTargetGroups[];
  setSnapshots: (snapshots: DiffGroupedSnapshotTargetGroups[]) => void;
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

export const createStore = (initProps?: Partial<ReviewerState>) =>
  createZustandStore<ReviewerState>()((set, get) => ({
    panel: "snapshots",
    setPanel: (panel) => set({ panel }),
    optimize: false,
    build: defaultBuild,
    setBuild: (build) => set({ build }),
    snapshots: [],
    setSnapshots: (snapshots) => set({ snapshots }),
    currentSnapshot: undefined,
    setCurrentSnapshot: (currentSnapshot) => set({ currentSnapshot }),
    showDiff: true,
    setShowDiff: (showDiff) => set({ showDiff }),
    panelOpen: true,
    setPanelOpen: (panelOpen) => {
      set((state) => ({
        panelOpen: panelOpen(state.panelOpen),
      }));
      document.cookie = `reviewer-sidebar-open=${get().panelOpen}; path=/; max-age=31536000`;
    },
    activeCompareTab: "double",
    setActiveCompareTab: (activeCompareTab) => set({ activeCompareTab }),
    framerLoaded: false,
    setFramerLoaded: () => set({ framerLoaded: true }),
    singleSnapshot: "head",
    setSingleSnapshot: (singleSnapshot) => set({ singleSnapshot }),

    buildAPI: {
      approveSnapshots: () => {},
      rejectSnapshots: () => {},
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
    ...initProps,
  }));

type ReviewStore = ReturnType<typeof createStore>;

export const StoreContext = createContext<ReviewStore | null>(null);
