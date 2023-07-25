"use client";

import { useEffect, useId } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Header, NavTab } from "@pixeleye/ui";
import { useTeamStore } from "../../breadcrumbStore";

export function ProjectHeader({ projectId }: { projectId: string }) {
  const pathName = usePathname();

  const setTeamId = useTeamStore((state) => state.setTeamId);

  const layoutId = useId();

  return (
    <>
      <Header>
        <NavTab.Tabs className="px-4">
          <NavTab
            layoutId={layoutId}
            asChild
            active={pathName === `/project/${projectId}`}
          >
            <Link scroll={false} href={`/project/${projectId}`}>
              Builds
            </Link>
          </NavTab>
          <NavTab
            layoutId={layoutId}
            asChild
            active={pathName?.includes(`/project/${projectId}/manage`)}
          >
            <Link scroll={false} href={`/project/${projectId}/manage`}>
              Manage
            </Link>
          </NavTab>
        </NavTab.Tabs>
      </Header>
    </>
  );
}
