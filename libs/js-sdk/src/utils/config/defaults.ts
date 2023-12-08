export type StorybookVariant = {
  name: string;
  params: string; // This should become optional once we have other options
};

export const defaults = {
  configFile: "",
  endpoint: "https://api.pixeleye.io",
  boothPort: "3003",
  targets: ["chromium", "firefox", "webkit"],
  viewports: ["1920x1080"],
  storybookOptions: {
    variants: [] as StorybookVariant[],
  },
};

export type Config = Partial<typeof defaults> & {
  token: string;
};
