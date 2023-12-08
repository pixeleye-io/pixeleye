import { Config } from "pixeleye";

const config: Config = {
  token: "pxi__bANrScCvvPlKASrB9XzqzEff_dQEVHD4:ffzt_pcw1OFIWg8UnG0A-",
  endpoint: "http://localhost:5000",
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
