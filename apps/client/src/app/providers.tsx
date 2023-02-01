"use client";

import { LazyMotion } from "framer-motion";
import { SessionProvider } from "next-auth/react";

const loadFeatures = () =>
  import("./framerFeatures.js").then((res) => res.default);

export default function Proiders({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={loadFeatures}>
      <SessionProvider>{children}</SessionProvider>{" "}
    </LazyMotion>
  );
}
