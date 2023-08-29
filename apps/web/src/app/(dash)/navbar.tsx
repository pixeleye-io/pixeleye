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
import { useSelectedLayoutSegments } from "next/navigation";
import { Segment, useBreadcrumbStore } from "./breadcrumbStore";
import Avatar from "@pixeleye/ui/src/avatar/avatar";
import { User } from "@pixeleye/api";
import { useTheme } from "next-themes";

export interface NavbarProps {
  user: User;
}

export function Navbar({ user }: NavbarProps) {
  const segmentRepo = useBreadcrumbStore((state) => state.segmentRepo);
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

  return (
    <nav className="flex justify-between px-4 pt-2 pb-1 bg-background">
      <Breadcrumbs>
        <Breadcrumbs.Item hideLeadingSlash asChild>
          <Link href="/dashboard" className="flex items-center">
            <Logo className="h-7 w-7 text-on-surface hover:text-primary" />
          </Link>
        </Breadcrumbs.Item>
        <Breadcrumbs.Item asChild>
          <div className="flex items-center ">
            <TeamSwitcher
              personal={{
                label: user.name || user.email,
                id: user.id,
                avatar: user.avatar,
              }}
              teams={[
                {
                  label: "Some org",
                  id: "123",
                },
                {
                  label: "Pixeleye",
                  id: "342",
                },
              ]}
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
              <Link href="/settings">Settings</Link>
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
