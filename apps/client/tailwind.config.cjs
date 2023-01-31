/** @type {import("tailwindcss").Config} */
module.exports = {
  presets: [require("@pixeleye/tailwind-config")],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "../../packages/ui/src/**/*.{js,jsx,ts,tsx}",
  ],
};
