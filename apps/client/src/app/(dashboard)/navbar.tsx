"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import { ChevronUpDownIcon } from "@heroicons/react/24/solid";
import { Theme, useThemeStore } from "@pixeleye/hooks";
import { Breadcrumbs, Button, Modal, NavLink, Select } from "@pixeleye/ui";
import Status, { StatusType } from "@pixeleye/ui/src/status";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Popover from "@radix-ui/react-popover";
import { cx } from "class-variance-authority";
import { useSession } from "next-auth/react";
import { create } from "zustand";
import { RouterOutputs } from "~/lib/api";
import { useTeamStore } from "~/lib/stores/team";

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

type Teams = RouterOutputs["team"]["getUserTeams"];

interface TeamToggleProps {
  name: string;
  className?: string;
  teams: Teams;
}
function TeamToggle({ name, teams, className }: TeamToggleProps) {
  const session = useSession();
  const [personal, other] = teams.reduce(
    (acc, team) => {
      if (
        team.type === "USER" &&
        team.users[0]?.userId === session.data?.user.id
      )
        return [team, acc[1]];
      return [acc[0], [...acc[1], team]];
    },
    [undefined, []] as [Teams[0] | undefined, Teams],
  );

  const teamId = useTeamStore((state) => state.teamId);

  const selected = teams.find((team) => team.id === teamId) || personal;

  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Popover.Root>
        <Popover.Anchor>
          <div className={cx("flex items-center", className)}>
            <Link
              href={
                selected && selected.id !== personal?.id
                  ? `/?team=${selected.id}`
                  : "/"
              }
            >
              {selected?.name}
            </Link>
            <Popover.Trigger className="px-0.5 py-2 ml-2 rounded hover:bg-gray-800">
              <ChevronUpDownIcon className="w-6 h-6" />
            </Popover.Trigger>
          </div>
        </Popover.Anchor>

        <Popover.Portal>
          <Popover.Content className="z-40 min-w-[10rem] px-4 pt-2 bg-gray-900 border border-gray-300 divide-y divide-gray-300 rounded dark:border-gray-700 dark:divide-gray-700">
            <h5 className="pb-2">Accounts</h5>
            {personal && (
              <div className="py-2">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Personal
                </p>
                <Popover.Close asChild>
                  <Link href="/" className="flex items-center">
                    {personal.name}
                  </Link>
                </Popover.Close>
              </div>
            )}
            {other.length > 0 && (
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Teams
                </p>
                <ol className="flex items-center">
                  {other.map((team) => (
                    <li className="ml-2" key={team.id}>
                      <Popover.Close asChild>
                        <Link href={`/?team=${team.id}`}>{team.name}</Link>
                      </Popover.Close>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            <div className="flex justify-center px-4 py-2 mt-4 -mx-4 bg-gray-850">
              <Button
                onClick={() => setModalOpen(true)}
                size="small"
                variant="secondary"
              >
                Add team
              </Button>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Add team"
        description="Add a new team to your account"
      >
        <Modal.Footer>
          <Modal.Button close>Close</Modal.Button>
        </Modal.Footer>
      </Modal>
    </>
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
  teamId?: string;
}
export function RegisterSegment({
  children,
  reference,
  order,
  teamId,
  segment,
}: RegisterSegmentProps) {
  useRegisterSegment(reference, order, segment);
  const setTeamId = useTeamStore((state) => state.setTeamId);
  useEffect(() => {
    if (teamId) setTeamId(teamId);
  }, [setTeamId, teamId]);

  return <>{children}</>;
}

interface NavBarProps {
  teams: Teams;
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
          <TeamToggle name="AlfieJones" teams={teams} />
        </Breadcrumbs.Item>
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
