const sharedConfig = require("@pixeleye/tailwind");

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [sharedConfig],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "../../libs/ui/src/**/*.{js,jsx,ts,tsx}",
    "../../libs/reviewer/src/**/*.{js,jsx,ts,tsx}",
  ],
};
