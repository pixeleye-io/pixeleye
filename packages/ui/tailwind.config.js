/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("@pixeleye/tailwind-config")],
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: ["class", '[data-mode="dark"]'],
  plugins: [require("./plugin")],
};
