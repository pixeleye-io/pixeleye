"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import { Breadcrumbs, NavLink } from "@pixeleye/ui";
import { useSession } from "next-auth/react";

function Avatar() {
  const session = useSession();
  const [imageFail, setImageFail] = useState(false);

  const initials = session.data?.user.name
    ?.split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("");

  return (
    <span className="relative z-0 flex items-center justify-center w-8 h-8 rounded-full select-none bg-neutral-300 dark:bg-neutral-700">
      {session.data?.user.image && !imageFail ? (
        <Image
          onError={() => setImageFail(true)}
          className="z-10 object-cover w-8 h-8 rounded-full"
          width="64"
          height="64"
          src={session.data.user.image}
          alt="Profile picture"
        />
      ) : (
        <span className="text-sm font-semibold text-black dark:text-white">
          {initials}
        </span>
      )}
    </span>
  );
}

export function NavBar() {
  const segments = useSelectedLayoutSegments();

  return (
    <nav className="flex justify-between px-4 py-4 bg-neutral-200/50 dark:bg-neutral-900/50">
      <Breadcrumbs>
        <Breadcrumbs.Item hideLeadingSlash href="/">
          Home
        </Breadcrumbs.Item>
        {segments &&
          ["project", "add"].includes(segments[0] || "") &&
          segments.map((segment, i, array) => {
            const href = array.slice(0, i + 1).join("/");
            return (
              <Breadcrumbs.Item key={segment} asChild>
                <Link href={href}>{segment}</Link>
              </Breadcrumbs.Item>
            );
          })}
      </Breadcrumbs>
      <div className="px-4">
        <div className="flex items-center space-x-4">
          <NavLink href="#">Changelog</NavLink>
          <NavLink href="#">Docs</NavLink>
          <Avatar />
        </div>
      </div>
    </nav>
  );
}
