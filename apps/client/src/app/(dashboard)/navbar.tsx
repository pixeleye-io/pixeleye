"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import { Theme, useThemeStore } from "@pixeleye/hooks";
import { Breadcrumbs, NavLink, Select } from "@pixeleye/ui";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useSession } from "next-auth/react";
import { create } from "zustand";

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

interface Segment {
  name: string;
  value: string;
}

interface BreadcrumStore {
  segmentRepo: Record<string, Segment>;
  setSegment: (key: string, segment: Segment) => void;
  deleteSegment: (key: string) => void;
}

export const useRegisterSegment = (
  key: string,
  order: number,
  segment?: Segment,
) => {
  const setSegment = useBreadcrumStore((state) => state.setSegment);
  const deleteSegment = useBreadcrumStore((state) => state.deleteSegment);

  useEffect(() => {
    if (!segment) return;
    setSegment(`${key}-${order}`, segment);
    return () => deleteSegment(`${key}-${order}`);
  }, [deleteSegment, key, order, segment, setSegment]);
};

export const useBreadcrumStore = create<BreadcrumStore>((set) => ({
  segmentRepo: {},
  setSegment: (key, segment) =>
    set((state) => ({
      segmentRepo: {
        ...state.segmentRepo,
        [key]: segment,
      },
    })),
  deleteSegment: (key) =>
    set((state) => {
      const { [key]: _, ...segmentRepo } = state.segmentRepo;
      return { segmentRepo };
    }),
}));

export function NavBar() {
  const segmentRepo = useBreadcrumStore((state) => state.segmentRepo);
  const selectedSegments = useSelectedLayoutSegments();

  const segments: Segment[] = [];
  selectedSegments.forEach((segment, i) => {
    const seg = segmentRepo[`${segment}-${i + 1}`];
    if (seg) segments.push({ value: seg.value, name: seg.name });
  });

  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  return (
    <nav className="flex justify-between px-4 py-4 bg-white/50 dark:bg-gray-900">
      <Breadcrumbs>
        <Breadcrumbs.Item hideLeadingSlash asChild>
          <Link href="/" className="flex items-center">
            <Image
              src="/logo-dark.svg"
              alt="Pixeleye logo"
              className="hidden mr-2 dark:block"
              width={32}
              height={32}
            />
            <Image
              src="/logo-light.svg"
              alt="Pixeleye logo"
              className="mr-2 dark:hidden"
              width={32}
              height={32}
            />
            Home
          </Link>
        </Breadcrumbs.Item>
        {segments.map((segment, i, array) => {
          const value = segment;
          const href = array
            .slice(0, i + 1)
            .map(({ value }) => value)
            .join("/");
          return (
            <Breadcrumbs.Item key={segment.value} asChild>
              <Link href={href}>{value.name}</Link>
            </Breadcrumbs.Item>
          );
        })}
      </Breadcrumbs>
      <div className="px-4">
        <div className="flex items-center space-x-4">
          <NavLink href="#">Changelog</NavLink>
          <NavLink href="#">Docs</NavLink>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <Avatar />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className="relative z-40 p-4 bg-white border rounded dark:bg-black border-neutral-300 dark:border-neutral-700">
                <DropdownMenu.Item>
                  <Select
                    label="Theme"
                    value={theme}
                    onValueChange={(value: string) => setTheme(value as Theme)}
                  >
                    <Select.Item value="system">System</Select.Item>
                    <Select.Item value="dark">Dark</Select.Item>
                    <Select.Item value="light">Light</Select.Item>
                  </Select>
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item>…</DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item>…</DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
    </nav>
  );
}
