import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";
import sharedConfig from "@pixeleye/tailwind";
import scrollbar from "tailwind-scrollbar";

const config: Config = {
  presets: [sharedConfig],
  content: [
    "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
    "../../libs/ui/src/**/*.{js,jsx,ts,tsx}",
    "../../libs/reviewer/src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [scrollbar],
};

export default config;
