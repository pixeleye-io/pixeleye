"use client";

import React from "react";
import { LazyMotion } from "framer-motion";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

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
