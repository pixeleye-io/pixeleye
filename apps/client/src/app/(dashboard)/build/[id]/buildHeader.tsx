"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Header, NavTab } from "@pixeleye/ui";

interface BuildHeaderProps {
  buildId: string;
}

export function BuildHeader({ buildId }: BuildHeaderProps) {
  const pathName = usePathname();

  return (
    <>
      <Header>
        <NavTab.Tabs className="px-4">
          <NavTab asChild active={pathName === `/build/${buildId}`}>
            <Link scroll={false} href={`/build/${buildId}`}>
              Overview
            </Link>
          </NavTab>
          <NavTab asChild active={pathName === `/build/${buildId}/review`}>
            <Link scroll={false} href={`/build/${buildId}/review`}>
              Review
            </Link>
          </NavTab>
        </NavTab.Tabs>
      </Header>
    </>
  );
}
