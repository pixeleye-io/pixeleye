"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import { ChevronUpDownIcon } from "@heroicons/react/24/solid";
import { Theme, useThemeStore } from "@pixeleye/hooks";
import { Breadcrumbs, NavLink, Select } from "@pixeleye/ui";
import Status, { StatusType } from "@pixeleye/ui/src/status";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Popover from "@radix-ui/react-popover";
import { cx } from "class-variance-authority";
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
    <span className="relative z-0 flex items-center justify-center w-8 h-8 bg-gray-300 rounded-full select-none dark:bg-gray-700">
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

interface TeamType {
  name: string;
  id: string;
  img: string;
}

interface TeamToggleProps {
  name: string;
  href: string;
  className?: string;
  teams: TeamType[];
}
function TeamToggle({ name, href, teams, className }: TeamToggleProps) {
  const session = useSession();

  return (
    <Popover.Root>
      <Popover.Anchor>
        <div className={cx("flex items-center", className)}>
          <Link href={href}>{name}</Link>
          <Popover.Trigger className="px-0.5 py-1 ml-2 rounded hover:bg-gray-800">
            <ChevronUpDownIcon className="w-6 h-6" />
          </Popover.Trigger>
        </div>
      </Popover.Anchor>

      <Popover.Portal>
        <Popover.Content className="z-50 px-4 py-2 bg-gray-900 border border-gray-300 divide-y divide-gray-300 rounded dark:border-gray-700 dark:divide-gray-700">
          <h5 className="pb-2">Accounts</h5>
          <div className="py-2">
            <p className="text-sm text-gray-700 dark:text-gray-300">Personal</p>
            <Popover.Close asChild>
              <Link href="#" className="flex items-center">
                {session.data?.user.name}
              </Link>
            </Popover.Close>
          </div>

          {teams.length > 0 && <p>Teams</p>}
          {teams.map((team) => (
            <div className="flex items-center" key={team.id}>
              <Image
                className="object-cover w-8 h-8 rounded-full"
                width="64"
                height="64"
                src={team.img}
                alt="Team logo"
              />
              <span className="ml-2">{team.name}</span>
            </div>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

interface Segment {
  name: string;
  value: string;
  status?: StatusType;
}

interface BreadcrumStore {
  segmentRepo: Record<string, Segment[]>;
  setSegment: (key: string, segment: Segment[]) => void;
  deleteSegment: (key: string) => void;
}

export const useRegisterSegment = (
  key: string,
  order: number,
  segment?: Segment | Segment[] | false,
) => {
  const setSegment = useBreadcrumStore((state) => state.setSegment);
  const deleteSegment = useBreadcrumStore((state) => state.deleteSegment);

  useEffect(() => {
    if (!segment) return;
    setSegment(`${key}-${order}`, Array.isArray(segment) ? segment : [segment]);
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

interface RegisterSegmentProps {
  children: React.ReactNode;
  reference: string;
  order: number;
  segment?: Segment[] | false | Segment;
}
export function RegisterSegment({
  children,
  reference,
  order,
  segment,
}: RegisterSegmentProps) {
  useRegisterSegment(reference, order, segment);
  return <>{children}</>;
}

interface NavBarProps {
  teams: TeamType[];
}

export function NavBar({ teams }: NavBarProps) {
  const segmentRepo = useBreadcrumStore((state) => state.segmentRepo);
  const selectedSegments = useSelectedLayoutSegments();

  const segments: Segment[] = [];
  selectedSegments.forEach((segment, i) => {
    const seg = segmentRepo[`${segment}-${i + 1}`];
    if (seg) seg.forEach((s) => segments.push(s));
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
              className="hidden mr-1 dark:block"
              width={32}
              height={32}
            />
            <Image
              src="/logo-light.svg"
              alt="Pixeleye logo"
              className="mr-1 dark:hidden"
              width={32}
              height={32}
            />
          </Link>
        </Breadcrumbs.Item>
        <Breadcrumbs.Item asChild>
          <TeamToggle href="/" name="AlfieJones" teams={teams} />
        </Breadcrumbs.Item>
        {segments.map((segment, i, array) => {
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
      <div className="px-4">
        <div className="flex items-center space-x-4">
          <NavLink href="#">Changelog</NavLink>
          <NavLink href="#">Docs</NavLink>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <Avatar />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className="relative z-40 border border-gray-200 rounded bg-gray-50 dark:bg-gray-900 dark:border-gray-800">
                <DropdownMenu.Group className="px-4 py-2">
                  <DropdownMenu.Item>…</DropdownMenu.Item>
                  <DropdownMenu.Item>…</DropdownMenu.Item>
                </DropdownMenu.Group>
                <DropdownMenu.Group className="px-4 py-2 border-t border-gray-200 rounded-b bg-gray-50 dark:bg-gray-850 dark:border-gray-800">
                  <DropdownMenu.Item asChild>
                    <Select
                      label="Theme"
                      value={theme}
                      onChange={(event) =>
                        setTheme(event.currentTarget.value as Theme)
                      }
                    >
                      <Select.Item value="system">System</Select.Item>
                      <Select.Item value="dark">Dark</Select.Item>
                      <Select.Item value="light">Light</Select.Item>
                    </Select>
                  </DropdownMenu.Item>
                </DropdownMenu.Group>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
    </nav>
  );
}
