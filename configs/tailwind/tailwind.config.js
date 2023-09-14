const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      screens: {
        xs: "420px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      colors: {
        /** Accent colors */
        primary: "rgba(var(--color-primary) / <alpha-value>)",
        "on-primary": "rgba(var(--color-on-primary) / <alpha-value>)",
        "primary-container":
          "rgba(var(--color-primary-container) / <alpha-value>)",
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
        "tertiary-container":
          "rgba(var(--color-tertiary-container) / <alpha-value>)",
        "on-tertiary-container":
          "rgba(var(--color-on-tertiary-container) / <alpha-value>)",
        error: "rgba(var(--color-error) / <alpha-value>)",
        "on-error": "rgba(var(--color-on-error) / <alpha-value>)",
        "error-container": "rgba(var(--color-error-container) / <alpha-value>)",
        "on-error-container":
          "rgba(var(--color-on-error-container) / <alpha-value>)",

        /** Neutral colors */
        surface: "rgba(var(--color-surface) / <alpha-value>)",
        "on-surface": "rgba(var(--color-on-surface) / <alpha-value>)",
        "surface-container-lowest":
          "rgba(var(--color-surface-container-lowest) / <alpha-value>)",
        "surface-container-low":
          "rgba(var(--color-surface-container-low) / <alpha-value>)",
        "surface-container":
          "rgba(var(--color-surface-container) / <alpha-value>)",
        "surface-container-high":
          "rgba(var(--color-surface-container-high) / <alpha-value>)",
        "surface-container-highest":
          "rgba(var(--color-surface-container-highest) / <alpha-value>)",
        outline: "rgba(var(--color-outline) / <alpha-value>)",
        "outline-variant": "rgba(var(--color-outline-variant) / <alpha-value>)",
        "surface-variant": "rgba(var(--color-surface-variant) / <alpha-value>)",
        "on-surface-variant":
          "rgba(var(--color-on-surface-variant) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["Inter var", ...defaultTheme.fontFamily.sans],
      },
      maxWidth: {
        "8xl": "90rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
