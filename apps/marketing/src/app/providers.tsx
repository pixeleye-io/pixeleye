"use client";

import React from "react";
import { LazyMotion } from "framer-motion";
import { ThemeProvider } from "next-themes";
import { create } from "zustand";
import { useReviewerStore } from "@pixeleye/reviewer";

export interface GlobalStore {
  framerLoaded: boolean;
  setFramerLoaded: () => void;
}

export const useGlobalStore = create<GlobalStore>()((set) => ({
  framerLoaded: false,
  setFramerLoaded: () => set({ framerLoaded: true }),
}));

export default function Providers({ children }: { children: React.ReactNode }) {
  const setFramerLoaded = useGlobalStore((state) => state.setFramerLoaded);
  const setFramerLoadedReviewer = useReviewerStore(
    (state) => state.setFramerLoaded
  );

  const loadFeatures = () =>
    import("./features.js").then((res) => {
      setFramerLoaded();
      setFramerLoadedReviewer();
      return res.default;
    });

  return (
    <ThemeProvider attribute="class">
      <LazyMotion features={loadFeatures}>{children}</LazyMotion>
    </ThemeProvider>
  );
}
