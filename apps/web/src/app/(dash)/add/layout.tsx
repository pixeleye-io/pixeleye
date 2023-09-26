import React from "react";
import { Divider } from "@pixeleye/ui";
import { RegisterSegment } from "../breadcrumbStore";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Divider />
      {children}
    </>
  );
}
