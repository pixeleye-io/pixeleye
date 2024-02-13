const config = {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  token: process.env.PIXELEYE_TOKEN,
  waitForStatus: true,

  storybookOptions: {
    variants: [
      {
        name: "Dark",
        params: "globals=theme:dark",
      },
      {
        name: "Light",
        params: "globals=theme:light",
      },
    ],
  },
};

export default config;
