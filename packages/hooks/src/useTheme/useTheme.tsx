import { isBrowser } from "@pixeleye/utils";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export const themeScript =
  "!function(){var e=JSON.parse(localStorage.getItem('theme')).state.theme||'system';e==='system'&&(e=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.classList.add(e);document.documentElement.style.colorScheme=e;}();";

export type Theme = "dark" | "light" | "system";

interface ThemeState {
  theme: Theme;
  resolvedTheme: Omit<Theme, "system">;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

function disableTransitionsTemporarily() {
  document.documentElement.classList.add("disable-transition");
  window.setTimeout(() => {
    document.documentElement.classList.remove("disable-transition");
  }, 0);
}

function toggleTheme(theme: Omit<Theme, "system">) {
  if (!isBrowser) return;
  disableTransitionsTemporarily();
  document.documentElement.style.colorScheme = theme as "dark" | "light";
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

const useThemeStore = create<ThemeState>()(
  devtools(
    persist(
      (set) => ({
        theme: "system",
        resolvedTheme:
          isBrowser && document.documentElement.classList.contains("dark")
            ? "dark"
            : "light" || "light",
        toggleTheme: () =>
          set((state) => {
            const newTheme = state.resolvedTheme === "dark" ? "light" : "dark";
            toggleTheme(newTheme);
            return { theme: newTheme, resolvedTheme: newTheme };
          }),
        setTheme: (theme) => {
          const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
            ? "dark"
            : "light";
          const resolvedTheme = theme === "system" ? systemTheme : theme;
          toggleTheme(resolvedTheme);
          set({ theme, resolvedTheme });
        },
      }),
      {
        name: "theme",
        partialize: (state) => ({
          theme: state.theme,
        }),
      },
    ),
  ),
);

export default useThemeStore;
