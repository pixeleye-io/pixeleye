"use client";

import React from "react";
import { LazyMotion } from "framer-motion"
import { ThemeProvider } from "next-themes";
const loadFeatures = () =>
    import("./features.js").then(res => res.default)

export default function Providers({ children }: { children: React.ReactNode }) {

    return (
    <ThemeProvider attribute="class">
        <LazyMotion features={loadFeatures}>
            {children}
        </LazyMotion>
    </ThemeProvider>

    )
}