"use client";

import React from "react";
import { LazyMotion } from "framer-motion";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const loadFeatures = () => import("./features.js").then((res) => res.default);

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient());

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
