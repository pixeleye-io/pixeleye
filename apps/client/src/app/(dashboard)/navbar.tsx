"use client";

import { useSelectedLayoutSegments } from "next/navigation";
import { Breadcrumbs } from "@pixeleye/ui";

export function NavBar() {
  const segments = useSelectedLayoutSegments();
  return (
    <nav className="bg-white dark:bg-black">
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
    </nav>
  );
}
