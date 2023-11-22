"use client";

import { useEffect, useId } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Header, NavTab } from "@pixeleye/ui";
import { useTeamStore } from "../breadcrumbStore";
import { env } from "@/env";
import { useTeam } from "@/libs";

export function HomeHeader() {
  const pathName = usePathname();
  const teamId = useSearchParams()?.get("team");

  const { team } = useTeam();

  const setTeamId = useTeamStore((state) => state.setTeamId);

  useEffect(() => {
    setTeamId(teamId || "");
  }, [setTeamId, teamId]);

  const layoutId = useId();

  return (
    <>
      <Header>
        <NavTab.Tabs className="px-4">
          <NavTab layoutId={layoutId} asChild active={pathName === "/dashboard"}>
            <Link
              scroll={false}
              href={"/dashboard" + ((teamId && `?team=${teamId}`) || "")}
            >
              Overview
            </Link>
          </NavTab>
          <NavTab layoutId={layoutId} asChild active={pathName === "/usage"}>
            <Link
              scroll={false}
              href={"/usage" + ((teamId && `?team=${teamId}`) || "")}
            >
              Usage
            </Link>
          </NavTab>
          {
            env.NEXT_PUBLIC_PIXELEYE_HOSTING === "true" && ["admin", "owner", "accountant"].includes(team?.role || "") && (
              <NavTab layoutId={layoutId} asChild active={pathName === "/billing"}>
                <Link
                  scroll={false}
                  href={"/billing" + ((teamId && `?team=${teamId}`) || "")}
                >
                  Billing
                </Link>
              </NavTab>
            )
          }
          <NavTab
            layoutId={layoutId}
            asChild
            active={pathName?.includes("/settings")}
          >
            <Link
              scroll={false}
              href={"/settings" + ((teamId && `/org?team=${teamId}`) || "")}
            >
              Settings
            </Link>
          </NavTab>
        </NavTab.Tabs>
      </Header>
    </>
  );
}
