"use client";

import { Breadcrumbs, Logo, Status } from "@pixeleye/ui";

import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import { Segment, useBreadcrumbStore } from "./breadcrumbStore";

export interface NavbarProps {}

export function Navbar({}: NavbarProps) {
  const segmentRepo = useBreadcrumbStore((state) => state.segmentRepo);
  const selectedSegments = useSelectedLayoutSegments();

  const segments: Segment[] = [];
  selectedSegments.forEach((segment, i) => {
    const seg = segmentRepo[`${segment}-${i + 1}`];
    if (seg) seg.forEach((s) => segments.push(s));
  });

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
    </nav>
  );
}
