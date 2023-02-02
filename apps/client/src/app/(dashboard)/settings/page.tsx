"use client";

import { Theme, useThemeStore } from "@pixeleye/hooks";

export default function SettingsPage() {
  const setTheme = useThemeStore((state) => state.setTheme);
  const theme = useThemeStore((state) => state.theme);
  return (
    <>
      <h2 className="mb-2 text-3xl">Theme preferences</h2>
      <p className="mb-4 text-base">Customise how Pixeleye looks and feels</p>
      <div>
        <div>
          <label
            htmlFor="location"
            className="block text-sm font-medium text-neutral-700"
          >
            Theme
          </label>
          <select
            id="location"
            name="location"
            className="block w-full max-w-xs py-2 pl-3 pr-10 mt-1 text-base rounded-md cursor-pointer border-neutral-300 focus:border-neutral-500 focus:outline-none focus:ring-neutral-500 sm:text-sm"
            value={theme}
            onChange={(e) => setTheme(e.target.value as Theme)}
          >
            <option value="system" className="cursor-pointer">
              System
            </option>
            <option value="dark" className="cursor-pointer">
              Dark
            </option>
            <option value="light" className="cursor-pointer">
              Light
            </option>
          </select>
        </div>
      </div>
    </>
  );
}
