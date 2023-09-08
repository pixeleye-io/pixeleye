"use client";

import { useTeamStore } from "@/app/(dash)/breadcrumbStore";
import { SidebarNavLink, SidebarNav } from "@pixeleye/ui";

const getItems = (teamID: string): SidebarNavLink[] => [
  {
    href: `/settings/org${teamID && `?team=${teamID}`}`,
    title: "General",
  },
  {
    href: `/settings/org/members${teamID && `?team=${teamID}`}`,
    title: "Members",
  },
  {
    href: `/settings/org/advanced${teamID && `?team=${teamID}`}`,
    title: "Advanced",
  },
];

export function OrgSidebar() {
  const teamID = useTeamStore((state) => state.teamId);

  const items = getItems(teamID);

  return <SidebarNav items={items} />;
}
