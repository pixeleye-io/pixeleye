/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}", "./src/_app.tsx"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        gray: {
          50: "#fafafa",
          100: "#ebebeb",
          200: "#e1e1e1",
          300: "#c1c1c1",
          400: "#a1a1a1",
          500: "#818181",
          600: "#616161",
          700: "#414141",
          800: "#2b2b2b",
          850: "#1a1a1a",
          900: "#111",
        },
      },
      transitionProperty: {
        DEFAULT:
          "color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, border-radius",
      },
    },
  },
  plugins: [require("../../ui/plugin")],
};
