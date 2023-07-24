"use client";

import { Breadcrumbs, Logo, Status } from "@pixeleye/ui";

import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import { Segment, useBreadcrumbStore } from "./breadcrumbStore";
import Avatar from "@pixeleye/ui/src/avatar/avatar";
import { User } from "@pixeleye/api";

export interface NavbarProps {
  user: User;
}

export function Navbar({ user }: NavbarProps) {
  const segmentRepo = useBreadcrumbStore((state) => state.segmentRepo);
  const selectedSegments = useSelectedLayoutSegments();

  const segments: Segment[] = [];
  selectedSegments.forEach((segment, i) => {
    const seg = segmentRepo[`${segment}-${i + 1}`];
    if (seg) seg.forEach((s) => segments.push(s));
  });

  // We attempt to get initials from the user's name and then email (assuming they use a firstname.lastname email)
  const names = user.name
    ? user.name.split(" ")
    : user.email.split("@")[0].split(".");

  return (
    <nav className="flex justify-between px-4 pt-2 pb-1 bg-background">
      <Breadcrumbs>
        <Breadcrumbs.Item hideLeadingSlash asChild>
          <Link href="/dashboard" className="flex items-center">
            <Logo className="h-7 w-7" />
          </Link>
        </Breadcrumbs.Item>
        {/* <Breadcrumbs.Item asChild>
          <div className="flex items-center">
            <TeamToggle name="AlfieJones" teams={teams} />
          </div>
        </Breadcrumbs.Item> */}
        {segments.map((segment) => {
          return (
            <Breadcrumbs.Item key={segment.value} asChild>
              <Link
                href={segment.value}
                className="flex items-center space-x-2"
              >
                {segment.status && <Status status={segment.status} />}
                <span>{segment.name}</span>
              </Link>
            </Breadcrumbs.Item>
          );
        })}
      </Breadcrumbs>
      <Avatar>
        <Avatar.Image alt="profile picture" src={user.avatar} />
        <Avatar.Fallback>
          {names[0].charAt(0)}
          {names.length > 1 && names.at(-1)?.charAt(0)}
        </Avatar.Fallback>
      </Avatar>
    </nav>
  );
}
