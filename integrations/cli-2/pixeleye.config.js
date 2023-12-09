/** @type {import('@pixeleye/js-sdk').Config} */
module.exports = {
  token: "pxi__24kcWUCid76IliRa7DitkmmavNIURgbb:8mY6BanNqaV-C982AXqNj",
  endpoint: "http://localhost:5000",
  storybookOptions: {
    variants: [
      {
        name: "dark",
        params: "?globals=theme:dark"
      },
      {
        name: "light",
        params: "?globals=theme:light"
      }
    ]
  },
};
