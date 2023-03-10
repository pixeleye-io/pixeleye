"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Header, NavTab } from "@pixeleye/ui";
import { useTeamStore } from "~/lib/stores/team";

export function HomeHeader() {
  const pathName = usePathname();
  const teamId = useSearchParams().get("team");

  const setTeamId = useTeamStore((state) => state.setTeamId);

  useEffect(() => {
    setTeamId(teamId || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Header>
        <NavTab.Tabs className="px-4">
          <NavTab asChild active={pathName === "/"}>
            <Link
              scroll={false}
              href={"/" + ((teamId && `?team=${teamId}`) || "")}
            >
              Projects
            </Link>
          </NavTab>
          <NavTab asChild active={pathName === "/usage"}>
            <Link
              scroll={false}
              href={"/usage" + ((teamId && `?team=${teamId}`) || "")}
            >
              Usage
            </Link>
          </NavTab>
          <NavTab asChild active={pathName?.includes("/settings")}>
            <Link
              scroll={false}
              href={"/settings" + ((teamId && `?team=${teamId}`) || "")}
            >
              Settings
            </Link>
          </NavTab>
        </NavTab.Tabs>
      </Header>
    </>
  );
}
