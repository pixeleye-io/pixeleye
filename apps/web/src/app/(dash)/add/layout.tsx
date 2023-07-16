import React from "react";
import { RegisterSegment } from "../breadcrumbStore";
import { Divider } from "@pixeleye/ui";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RegisterSegment
      order={1}
      reference="add"
      segment={{
        name: "Add project",
        value: "/add",
      }}
    >
      <Divider />
      {children}
    </RegisterSegment>
  );
}
