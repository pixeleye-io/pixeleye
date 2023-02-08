import React from "react";
import { RegisterSegment } from "../navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RegisterSegment
      order={1}
      reference="add"
      segment={{
        name: "Add",
        value: "add",
      }}
    >
      <hr className="w-full border-t border-neutral-300 dark:border-neutral-700" />
      {children}
    </RegisterSegment>
  );
}
