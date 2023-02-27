import React from "react";
import { RegisterSegment } from "../../navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RegisterSegment
      order={2}
      reference="github"
      segment={{
        name: "Github",
        value: "/add/github",
      }}
    >
      {children}
    </RegisterSegment>
  );
}
