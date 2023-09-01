import React from "react";
import { Divider } from "@pixeleye/ui";
import { RegisterSegment } from "../breadcrumbStore";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RegisterSegment
        order={1}
        reference="add"
        segment={{
          name: "Add Project",
          value: "/add",
        }}
      />
      <Divider />
      {children}
    </>
  );
}
