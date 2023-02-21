"use client";

import { api } from "~/lib/api";

export default function UsagePage() {
  const { data: installs } = api.github.getMembers.useQuery({
    teamId: "cled1hg040000tgo80ke8wi0h",
  });

  console.log("installs", installs);
  return (
    <div>
      <h1>Usage Page</h1>
    </div>
  );
}
