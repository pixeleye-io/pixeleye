"use client";

import { useThemeStore } from "@pixeleye/hooks";
import { Button } from "@pixeleye/ui";

export default function IndexPage() {
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  // const setTheme = useThemeStore((state) => state.setTheme);

  return (
    <div>
      <h1>Index Page</h1>
      <Button onClick={() => toggleTheme()}>HEllo</Button>
    </div>
  );
}
