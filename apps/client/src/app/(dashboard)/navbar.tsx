"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { Theme, useThemeStore } from "@pixeleye/hooks";
import { Breadcrumbs, NavLink } from "@pixeleye/ui";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Label } from "@radix-ui/react-label";
import * as Select from "@radix-ui/react-select";
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

  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  return (
    <nav className="flex justify-between px-4 py-4 bg-white/50 dark:bg-black/50">
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
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <Avatar />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className="p-4 bg-white border rounded dark:bg-black border-neutral-300 dark:border-neutral-700">
                <DropdownMenu.Item>
                  <Label className="flex items-center">
                    Theme
                    <Select.Root
                      value={theme}
                      onValueChange={(value: Theme) => setTheme(value)}
                    >
                      <Select.Trigger className="flex items-center justify-between w-full max-w-xs px-4 py-2 ml-2 border rounded h-9 dark:border-neutral-700 border-neutral-300">
                        <Select.Value />
                        <Select.Icon>
                          <ChevronDownIcon className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
                        </Select.Icon>
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content
                          className="w-[var(--radix-select-trigger-width)] max-h-[var(--radix-select-content-available-height)] overflow-auto bg-neutral-100 rounded-md shadow-lg dark:bg-neutral-900"
                          position="popper"
                          sideOffset={5}
                        >
                          <Select.Item
                            value="system"
                            className="p-2 rounded-md cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-800"
                          >
                            <Select.ItemText>System</Select.ItemText>
                            <Select.ItemIndicator />
                          </Select.Item>
                          <Select.Item
                            value="dark"
                            className="p-2 rounded-md cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-800"
                          >
                            <Select.ItemText>Dark</Select.ItemText>
                            <Select.ItemIndicator />
                          </Select.Item>
                          <Select.Item
                            value="light"
                            className="p-2 rounded-md cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-800"
                          >
                            <Select.ItemText>Light</Select.ItemText>
                            <Select.ItemIndicator />
                          </Select.Item>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                  </Label>
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
