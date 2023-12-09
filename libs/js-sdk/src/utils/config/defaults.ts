import { devices } from ".";

export type StorybookVariant = {
  name: string;
  params: string; // This should become optional once we have other options
};

export const defaults = {
  configFile: "",
  endpoint: "https://api.pixeleye.io",
  boothPort: "3003",
  devices: [
    devices["Desktop Chrome"],
    devices["Desktop Firefox"],
    devices["Desktop Safari"],
  ],
  storybookOptions: {
    variants: [] as StorybookVariant[],
  },
};

export type Config = Partial<typeof defaults> & {
  token: string;
};
