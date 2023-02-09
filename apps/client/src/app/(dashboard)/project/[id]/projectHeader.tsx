"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Header, NavTab } from "@pixeleye/ui";

export function ProjectHeader() {
  const pathname = usePathname()!;
  const projectId = pathname.split("/")[2];

  return (
    <>
      <Header>
        <NavTab.Tabs className="px-4">
          <NavTab asChild active={pathname === `/project/${projectId}`}>
            <Link scroll={false} href={`/project/${projectId}`}>
              Builds
            </Link>
          </NavTab>
          <NavTab asChild active={pathname === `/project/${projectId}/library`}>
            <Link scroll={false} href={`/project/${projectId}/library`}>
              Library
            </Link>
          </NavTab>
          <NavTab
            asChild
            active={pathname?.includes(`/project/${projectId}/manage`)}
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
