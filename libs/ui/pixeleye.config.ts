import { Config } from "pixeleye";

const config: Config = {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  token: process.env.PIXELEYE_TOKEN!,

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
