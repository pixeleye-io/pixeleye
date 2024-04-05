import { Config } from "pixeleye";
import { devices } from "@pixeleye/cli-devices";

const config: Config = {
  token: "your-token-here",
  devices: [
    {
      width: 1280,
      height: 720,
    },
    {
      width: 768,
      height: 1024,
    },
    {
      width: 375,
      height: 667,
    },
  ].flatMap((viewport) => [
    { ...devices["Desktop Chrome"], viewport },
    { ...devices["Desktop Firefox"], viewport },
    { ...devices["Desktop Safari"], viewport },
    { ...devices["Desktop Edge"], viewport },
  ]),
};

export default config;
