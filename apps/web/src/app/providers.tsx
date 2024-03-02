"use client";

import React, { useEffect } from "react";
import { LazyMotion } from "framer-motion";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { create } from "zustand";

const loadFeatures = () => import("./features.js").then((res) => res.default);


function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // avoid refetching prefetched data
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  if (typeof window === 'undefined') {
    return makeQueryClient()
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}

export const useBackendURL = create<{
  backendURL?: string;
  setBackendURL: (url: string) => void;
}>((set) => ({
  setBackendURL: (url: string) => set({ backendURL: url }),
}));

export default function Providers({ children, backendURL }: { children: React.ReactNode; backendURL: string }) {
  const queryClient = getQueryClient()

  useEffect(() => {
    useBackendURL.setState({ backendURL });
  }, [backendURL]);

  return (
    <ThemeProvider attribute="class">
      <LazyMotion features={loadFeatures}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </LazyMotion>
    </ThemeProvider>
  );
}
