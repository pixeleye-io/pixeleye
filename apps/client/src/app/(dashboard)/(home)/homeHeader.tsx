"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Header, NavTab } from "@pixeleye/ui";

export function HomeHeader() {
  const pathName = usePathname();

  return (
    <>
      <Header>
        <NavTab.Tabs className="px-4">
          <NavTab asChild active={pathName === "/"}>
            <Link scroll={false} href="/">
              Projects
            </Link>
          </NavTab>
          <NavTab asChild active={pathName === "/usage"}>
            <Link scroll={false} href="/usage">
              Usage
            </Link>
          </NavTab>
          <NavTab asChild active={pathName?.includes("/settings")}>
            <Link scroll={false} href="/settings">
              Settings
            </Link>
          </NavTab>
        </NavTab.Tabs>
      </Header>
    </>
  );
}
