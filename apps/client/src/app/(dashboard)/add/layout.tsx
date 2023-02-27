import React from "react";
import { RegisterSegment } from "../navbar";

export default function Layout({
  children,
  searchParams,
}: {
  children: React.ReactNode;
  searchParams?: Record<string, string>;
}) {
  console.log("LKDJFLKSJFKLDJSLF", searchParams?.team);
  return (
    <RegisterSegment
      order={1}
      reference="add"
      teamId={searchParams?.team}
      segment={{
        name: "Add",
        value: "/add",
      }}
    >
      <hr className="w-full border-t border-neutral-300 dark:border-neutral-700" />
      {children}
    </RegisterSegment>
  );
}
