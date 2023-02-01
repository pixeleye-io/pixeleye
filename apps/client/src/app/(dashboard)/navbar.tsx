"use client";

import { useSelectedLayoutSegments } from "next/navigation";
import { Breadcrumbs, NavLink } from "@pixeleye/ui";

export function NavBar() {
  const segments = useSelectedLayoutSegments();
  return (
    <nav className="flex justify-between py-4 mx-4 bg-white dark:bg-black">
      <Breadcrumbs>
        <Breadcrumbs.Item hideLeadingSlash href="/">
          Home
        </Breadcrumbs.Item>
        {segments.map((segment, i, array) => {
          const href = array.slice(0, i + 1).join("/");
          return (
            <Breadcrumbs.Item key={segment} href={href}>
              {segment}
            </Breadcrumbs.Item>
          );
        })}
      </Breadcrumbs>
      <div className="">
        <div className="space-x-4">
          <NavLink href="/login">Changelog</NavLink>
          <NavLink href="/login">Docs</NavLink>
        </div>
      </div>
    </nav>
  );
}
