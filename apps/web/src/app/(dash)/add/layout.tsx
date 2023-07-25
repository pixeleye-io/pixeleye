import React from "react";
import { Divider } from "@pixeleye/ui";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Divider />
      {children}
    </>
  );
}
