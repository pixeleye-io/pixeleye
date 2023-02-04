"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavTab } from "@pixeleye/ui";
import { m, useMotionTemplate, useScroll, useTransform } from "framer-motion";

export function Header() {
  const pathName = usePathname();
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 63, 64], [0, 0, 0.1]);

  const boxShadow = useMotionTemplate`0 1px 3px 0 rgb(0 0 0 / ${opacity}), 0 1px 2px -1px rgb(0 0 0 / ${opacity})`;
  return (
    <m.header
      style={{ boxShadow }}
      className="sticky top-0 z-40 px-4 border-b bg-white/50 dark:bg-black/50 backdrop-blur-sm border-neutral-300 dark:border-neutral-700"
    >
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
        <NavTab asChild active={pathName?.includes("/settings")}>
          <Link scroll={false} href="/settings">
            Settings
          </Link>
        </NavTab>
      </NavTab.Tabs>
    </m.header>
  );
}
