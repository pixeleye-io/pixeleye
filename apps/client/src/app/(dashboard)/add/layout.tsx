"use client";

import React from "react";
import { useRegisterSegment } from "../navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  useRegisterSegment("add", 1, {
    name: "Add",
    value: "add",
  });

  return (
    <>
      <hr className="w-full border-t border-neutral-300 dark:border-neutral-700" />
      {children}
    </>
  );
}
