import type { Config } from "tailwindcss";
// @ts-ignore
import sharedConfig from "@pixeleye/tailwind";

import forms from "@tailwindcss/forms";

const config: Config = {
  presets: [sharedConfig],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "../../libs/ui/src/**/*.{js,jsx,ts,tsx}",
    "../../libs/reviewer/src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [forms],
};
export default config;
