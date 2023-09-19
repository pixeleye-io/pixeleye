"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { useTheme } from "next-themes";

export function Widget() {
  const theme = useTheme();

  return (
    <Turnstile
      options={{
        theme: theme.resolvedTheme === "dark" ? "dark" : "light",
        size: "invisible",
      }}
      siteKey="0x4AAAAAAAKZvsZET2JzmpMq"
    />
  );
}
