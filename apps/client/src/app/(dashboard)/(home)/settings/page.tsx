"use client";

import { Theme, useThemeStore } from "@pixeleye/hooks";
import { Select } from "@pixeleye/ui";

export default function SettingsPage() {
  const setTheme = useThemeStore((state) => state.setTheme);
  const theme = useThemeStore((state) => state.theme);
  return (
    <>
      <section>
        <h3 className="mb-2 text-2xl">Profile</h3>
        <p className="mb-4 text-base text-gray-700 dark:text-gray-300">
          This information will be displayed publicly so be careful what you
          share.
        </p>
        <div>
          <div></div>
        </div>
      </section>
      <section>
        <h3 className="mb-2 text-2xl">Theme preferences</h3>
        <p className="mb-4 text-base text-gray-700 dark:text-gray-300">
          Customise how Pixeleye looks and feels
        </p>
        <div>
          <div>
            <Select
              label="Theme"
              className="max-w-xs"
              value={theme}
              onChange={(event) => setTheme(event.currentTarget.value as Theme)}
            >
              <Select.Item value="system">System</Select.Item>
              <Select.Item value="dark">Dark</Select.Item>
              <Select.Item value="light">Light</Select.Item>
            </Select>
          </div>
        </div>
      </section>
    </>
  );
}
