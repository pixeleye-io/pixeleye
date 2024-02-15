"use client";

import React from "react";
import { LazyMotion } from "framer-motion";
import { ThemeProvider } from "next-themes";
import { create } from "zustand";
import { PostHogProvider } from 'posthog-js/react';
import posthog from 'posthog-js'
import { env } from "./env";


if (typeof window !== 'undefined' && env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: "https://pixeleye.io/ingest",
    ui_host: "https://eu.posthog.com",
    capture_pageview: false, // Disable automatic pageview capture, as we capture manually
    autocapture: false, // Disable automatic event capture, as we capture manually
    capture_pageleave: true
  })
}

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


  const loadFeatures = () =>
    import("./features.js").then((res) => {
      setFramerLoaded();
      return res.default;
    });

  return (
    <PostHogProvider>
      <ThemeProvider attribute="class">
        <LazyMotion features={loadFeatures}>{children}</LazyMotion>
      </ThemeProvider>
    </PostHogProvider>
  );
}