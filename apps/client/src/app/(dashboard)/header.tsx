"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavTab } from "@pixeleye/ui";

export function Header() {
  const pathName = usePathname();
  return (
    <header className="sticky top-0 z-40 px-4 border-b bg-white/50 dark:bg-black/50 backdrop-blur-sm border-neutral-300 dark:border-neutral-700">
      <NavTab.Tabs>
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
        <NavTab asChild active={pathName === "/settings"}>
          <Link scroll={false} href="/settings">
            Settings
          </Link>
        </NavTab>
      </NavTab.Tabs>
    </header>
  );
}
