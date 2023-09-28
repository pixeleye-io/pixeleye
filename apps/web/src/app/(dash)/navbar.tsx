"use client";

import {
  Breadcrumbs,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Logo,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Status,
  TeamSwitcher,
} from "@pixeleye/ui";

import Link from "next/link";
import {
  usePathname,
  useRouter,
  useSearchParams,
  useSelectedLayoutSegments,
} from "next/navigation";
import { Segment, useBreadcrumbStore, useTeamStore } from "./breadcrumbStore";
import Avatar from "@pixeleye/ui/src/avatar/avatar";
import { Team, User } from "@pixeleye/api";
import { useTheme } from "next-themes";
import React, { useCallback } from "react";
import { API } from "@/libs";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cx } from "class-variance-authority";
import { queries } from "@/queries";

export interface NavbarProps {
  user: User;
  teams: Team[];
}

function useTeamNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams()!;

  return useCallback(
    (team: Team) => {
      const params = new URLSearchParams(searchParams);

      if (team.type === "user" && team.role === "owner") {
        params.delete("team");
      } else {
        params.set("team", team.id);
      }

      if (pathname.startsWith("/builds") || pathname.startsWith("/projects")) {
        return router.push("/dashboard?" + params.toString());
      }

      router.push(pathname + "?" + params.toString());
    },
    [router, pathname, searchParams]
  );
}

function TeamsHeading() {
  const queryClient = useQueryClient();

  const { mutate: syncTeams, isPending } = useMutation({
    mutationFn: () => API.post("/user/teams/sync", {}),
    onSuccess: () => {
      queryClient.invalidateQueries(queries.teams.list());
    },
  });

  return (
    <div className="flex justify-between items-center">
      <span>Teams</span>
      <Button
        onClick={() => syncTeams()}
        disabled={isPending}
        variant={"ghost"}
        className="!w-4 !h-4"
        size="icon"
      >
        <ArrowPathIcon
          className={cx(
            "text-on-surface-variant h-4 w-4 hover:text-on-surface",
            isPending && "animate-spin"
          )}
        />
      </Button>
    </div>
  );
}

export function Navbar({ user, teams }: NavbarProps) {
  const segmentRepo = useBreadcrumbStore((state) => state.segmentRepo);
  const selectedTeamID = useTeamStore((state) => state.teamId);
  const setSelectedTeamID = useTeamStore((state) => state.setTeamId);
  const selectedSegments = useSelectedLayoutSegments();

  const { theme, setTheme } = useTheme();

  const segments: Segment[] = [];
  selectedSegments.forEach((segment, i) => {
    const seg = segmentRepo[`${segment}-${i + 1}`];
    if (seg) seg.forEach((s) => segments.push(s));
  });

  // We attempt to get initials from the user's name and then email (assuming they use a firstname.lastname email)
  const names = user.name
    ? user.name.split(" ")
    : user.email.split("@")[0].split(".");

  const [personalTeam, groupTeams] = teams.reduce(
    (acc, team) => {
      if (team.type === "user" && team.role === "owner") {
        acc[0] = team;
      } else {
        acc[1].push(team);
      }
      return acc;
    },
    [undefined, []] as [Team | undefined, Team[]]
  );

  const searchParams = useSearchParams();

  const params = new URLSearchParams(searchParams);

  const navigate = useTeamNavigation();

  const selectedTeam =
    teams.find((team) => team.id === selectedTeamID) || personalTeam!;

  if (selectedTeam.type === "user" && selectedTeam.role === "owner")
    params.delete("team");
  else params.set("team", selectedTeam.id);

  return (
    <nav className="flex justify-between px-4 pt-2 pb-1 bg-background">
      <Breadcrumbs>
        <Breadcrumbs.Item hideLeadingSlash asChild>
          <Link
            href={`/dashboard?` + params.toString()}
            className="flex items-center"
          >
            <Logo className="h-7 w-7 text-on-surface hover:text-primary" />
          </Link>
        </Breadcrumbs.Item>
        <Breadcrumbs.Item asChild>
          <div className="flex items-center ">
            <TeamSwitcher
              personal={personalTeam!}
              teams={groupTeams}
              selectedTeam={selectedTeam}
              teamsHeading={<TeamsHeading />}
              setSelectedTeam={(team) => {
                setSelectedTeamID(team.id);
                navigate(team);
              }}
            />
          </div>
        </Breadcrumbs.Item>
        {segments.map((segment) => {
          return (
            <Breadcrumbs.Item key={segment.value} asChild>
              <Link
                href={segment.value}
                className="flex items-center space-x-2 text-sm"
              >
                {segment.status && <Status status={segment.status} />}
                <span>{segment.name}</span>
              </Link>
            </Breadcrumbs.Item>
          );
        })}
      </Breadcrumbs>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar>
              <Avatar.Image alt="profile picture" src={user.avatar} />
              <Avatar.Fallback>
                {names[0].charAt(0)}
                {names.length > 1 && names.at(-1)?.charAt(0)}
              </Avatar.Fallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none text-on-surface">
                {user.name || user.email.split("@")[0]}
              </p>
              <p className="text-xs leading-none text-on-surface-variant">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <Link href={`/settings?` + params.toString()}>Settings</Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Select value={theme} onValueChange={(theme) => setTheme(theme)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href="/logout">Log out</a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
