"use client";

import Image from "next/image";
import { useSelectedLayoutSegments } from "next/navigation";
import { Breadcrumbs, NavLink } from "@pixeleye/ui";

export function NavBar() {
  const segments = useSelectedLayoutSegments();

  return (
    <nav className="flex justify-between px-4 py-4 bg-white dark:bg-black">
      <Breadcrumbs>
        <Breadcrumbs.Item hideLeadingSlash href="/">
          Home
        </Breadcrumbs.Item>
        {segments &&
          segments[0] === "project" &&
          segments.map((segment, i, array) => {
            const href = array.slice(0, i + 1).join("/");
            return (
              <Breadcrumbs.Item key={segment} href={href}>
                {segment}
              </Breadcrumbs.Item>
            );
          })}
      </Breadcrumbs>
      <div className="px-4">
        <div className="flex items-center space-x-4">
          <NavLink href="#">Changelog</NavLink>
          <NavLink href="#">Docs</NavLink>
          <Image
            className="object-cover w-8 h-8 rounded-full"
            width="64"
            height="64"
            src="https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?&w=128&h=128&dpr=2&q=80"
            alt="Colm Tuite"
          />
        </div>
      </div>
    </nav>
  );
}
