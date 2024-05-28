import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const themeColors = {
  primary: "rgba(var(--color-primary) / <alpha-value>)",
  "on-primary": "rgba(var(--color-on-primary) / <alpha-value>)",
  "primary-container": "rgba(var(--color-primary-container) / <alpha-value>)",
  "on-primary-container":
    "rgba(var(--color-on-primary-container) / <alpha-value>)",
  secondary: "rgba(var(--color-secondary) / <alpha-value>)",
  "on-secondary": "rgba(var(--color-on-secondary) / <alpha-value>)",
  "secondary-container":
    "rgba(var(--color-secondary-container) / <alpha-value>)",
  "on-secondary-container":
    "rgba(var(--color-on-secondary-container) / <alpha-value>)",
  tertiary: "rgba(var(--color-tertiary) / <alpha-value>)",
  "on-tertiary": "rgba(var(--color-on-tertiary) / <alpha-value>)",
  "tertiary-container": "rgba(var(--color-tertiary-container) / <alpha-value>)",
  "on-tertiary-container":
    "rgba(var(--color-on-tertiary-container) / <alpha-value>)",
  error: "rgba(var(--color-error) / <alpha-value>)",
  "on-error": "rgba(var(--color-on-error) / <alpha-value>)",
  "error-container": "rgba(var(--color-error-container) / <alpha-value>)",
  "on-error-container": "rgba(var(--color-on-error-container) / <alpha-value>)",
  outline: "rgba(var(--color-outline) / <alpha-value>)",
  "outline-variant": "rgba(var(--color-outline-variant) / <alpha-value>)",
  shadow: "rgba(var(--color-shadow) / <alpha-value>)",
  scrim: "rgba(var(--color-scrim) / <alpha-value>)",
  "inverse-surface": "rgba(var(--color-inverse-surface) / <alpha-value>)",
  "inverse-on-surface": "rgba(var(--color-inverse-on-surface) / <alpha-value>)",
  "inverse-primary": "rgba(var(--color-inverse-primary) / <alpha-value>)",
  "surface-dim": "rgba(var(--color-surface-dim) / <alpha-value>)",
  "surface-bright": "rgba(var(--color-surface-bright) / <alpha-value>)",
  "surface-container-lowest":
    "rgba(var(--color-surface-container-lowest) / <alpha-value>)",
  "surface-container-low":
    "rgba(var(--color-surface-container-low) / <alpha-value>)",
  "surface-container": "rgba(var(--color-surface-container) / <alpha-value>)",
  "surface-container-high":
    "rgba(var(--color-surface-container-high) / <alpha-value>)",
  "surface-container-highest":
    "rgba(var(--color-surface-container-highest) / <alpha-value>)",
  surface: "rgba(var(--color-surface) / <alpha-value>)",
  "on-surface": "rgba(var(--color-on-surface) / <alpha-value>)",
  "surface-variant": "rgba(var(--color-surface-variant) / <alpha-value>)",
  "on-surface-variant": "rgba(var(--color-on-surface-variant) / <alpha-value>)",
  "primary-fixed": "rgba(var(--color-primary-fixed) / <alpha-value>)",
  "on-primary-fixed": "rgba(var(--color-on-primary-fixed) / <alpha-value>)",
  "primary-fixed-dim": "rgba(var(--color-primary-fixed-dim) / <alpha-value>)",
  "on-primary-fixed-variant":
    "rgba(var(--color-on-primary-fixed-variant) / <alpha-value>)",
  "secondary-fixed": "rgba(var(--color-secondary-fixed) / <alpha-value>)",
  "on-secondary-fixed": "rgba(var(--color-on-secondary-fixed) / <alpha-value>)",
  "secondary-fixed-dim":
    "rgba(var(--color-secondary-fixed-dim) / <alpha-value>)",
  "on-secondary-fixed-variant":
    "rgba(var(--color-on-secondary-fixed-variant) / <alpha-value>)",
  "tertiary-fixed": "rgba(var(--color-tertiary-fixed) / <alpha-value>)",
  "on-tertiary-fixed": "rgba(var(--color-on-tertiary-fixed) / <alpha-value>)",
  "tertiary-fixed-dim": "rgba(var(--color-tertiary-fixed-dim) / <alpha-value>)",
  "on-tertiary-fixed-variant":
    "rgba(var(--color-on-tertiary-fixed-variant) / <alpha-value>)",
};

const config: Config = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ...themeColors,
      },
      textShadow: {
        md: "0 4px 0 rgba(var(--color-primary) / 0.5)",
        sm: "0 2px 0 rgba(var(--color-primary) / 0.5)",
      },
    },
  },
  plugins: [
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          "text-shadow": (value) => ({
            textShadow: value,
          }),
        },
        { values: theme("textShadow") }
      );
    }),
  ],
};

export default config;
