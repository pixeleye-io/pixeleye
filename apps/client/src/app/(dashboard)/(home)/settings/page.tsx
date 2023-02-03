"use client";

import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { Theme, useThemeStore } from "@pixeleye/hooks";
import { Label } from "@radix-ui/react-label";
import * as Select from "@radix-ui/react-select";

export default function SettingsPage() {
  const setTheme = useThemeStore((state) => state.setTheme);
  const theme = useThemeStore((state) => state.theme);
  return (
    <>
      <h2 className="mb-2 text-3xl">Theme preferences</h2>
      <p className="mb-4 text-base">Customise how Pixeleye looks and feels</p>
      <div>
        <div>
          <Label>
            Theme
            <Select.Root
              value={theme}
              onValueChange={(value: Theme) => setTheme(value)}
            >
              <Select.Trigger className="flex items-center justify-between w-full max-w-xs px-4 py-2 border rounded h-9 dark:border-neutral-700 border-neutral-300">
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

          {/* <select
            id="location"
            name="location"
            className="block w-full max-w-xs py-2 pl-3 pr-10 mt-1 text-base rounded-md cursor-pointer border-neutral-300 focus:border-neutral-500 focus:outline-none focus:ring-neutral-500 sm:text-sm"
            value={{ label: theme } as any}
            onChange={(e) => setTheme(e.target.value as Theme)}
          >
            <option value="dark" className="cursor-pointer">
              Dark
            </option>
            <option value="system" className="cursor-pointer">
              System
            </option>
            <option value="light" className="cursor-pointer">
              Light
            </option>
          </select> */}
        </div>
      </div>
    </>
  );
}
