const plugin = require("tailwindcss/plugin");

const base = {};

const components = {
  // Custom css for input
  ".floating-label": {
    "&:placeholder-shown ~ fieldset > legend": {
      "max-width": "0px",
    },
    "&:focus ~ fieldset > legend": {
      "max-width": "100%",
    },
  },
  // custom css for spinner
  ".progress-circular": {
    animation: "spin 2.5s linear infinite",
    circle: {
      "@keyframes progress-circular-animation": {
        "0%": {
          "stroke-dasharray": "1px, 200px",
          "stroke-dashoffset": "0",
        },
        "50%": {
          "stroke-dasharray": "100px, 200px",
          "stroke-dashoffset": "-15",
        },
        "100%": {
          "stroke-dasharray": "100px, 200px",
          "stroke-dashoffset": "-125",
        },
      },
      animation: "progress-circular-animation 2.5s ease-in-out infinite",
    },
  },
};

const utilities = {
  /**
   * Hide number spinner
   */
  // Chrome, Safari, Edge, Opera
  "input.hide-spinner": {
    "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button": {
      margin: "0",
      "-webkit-appearance": "none",
    },
    // Firefox
    "&[type=number]": {
      "-moz-appearance": "textfield",
    },
  },
  // Hide the mobile tab highlight
  ".hide-tap-highlight": {
    "-webkit-tap-highlight-color": "transparent",
  },
};

const mainFunction = ({ addComponents, addUtilities, addBase }) => {
  addComponents(components);
  addUtilities(utilities);
  addBase(base);
};

module.exports = plugin(mainFunction);
