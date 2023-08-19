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

  useEffect(() => {
    const sse = new EventSource(
      `http://localhost:5000/v1/projects/${projectId}/events`,
      { withCredentials: true }
    );

    sse.onmessage = (event) => {
      console.log("message", event);
    };

    sse.addEventListener("open", (event) => {
      console.log("open", event);
    });

    sse.addEventListener("message", (event) => {
      console.log("message 2", event);
    });
  }, []);

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
