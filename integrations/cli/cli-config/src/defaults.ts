import { devices } from "@pixeleye/cli-devices";
import { Config } from "./types";

export const defaultConfig: Omit<Config, "token"> = {
  boothPort: "3003",
  devices: [
    devices["Desktop Chrome"],
    devices["Desktop Firefox"],
    devices["Desktop Safari"],
    devices["Desktop Edge"],
  ],
  endpoint: "https://api.pixeleye.io",
  storybookOptions: {
    variants: [],
  },
  maskColor: "#FF00FF",
  css: undefined,
  waitForStatus: false,
};
