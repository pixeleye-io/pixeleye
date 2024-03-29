"use client";

import { useId } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Header, NavTab } from "@pixeleye/ui";

export function ProjectHeader({ projectId }: { projectId: string }) {
  const pathName = usePathname();

  const layoutId = useId();

  return (
    <>
      <Header>
        <NavTab.Tabs className="px-4">
          <NavTab
            layoutId={layoutId}
            asChild
            active={pathName === `/projects/${projectId}`}
          >
            <Link scroll={false} href={`/projects/${projectId}`}>
              Builds
            </Link>
          </NavTab>
          <NavTab
            layoutId={layoutId}
            asChild
            active={pathName?.includes(`/projects/${projectId}/manage`)}
          >
            <Link scroll={false} href={`/projects/${projectId}/manage`}>
              Manage
            </Link>
          </NavTab>
        </NavTab.Tabs>
      </Header>
    </>
  );
}
