export const defaults = {
  configFile: "",
  endpoint: "https://api.pixeleye.io",
  boothPort: "3003",
  targets: ["chromium", "firefox", "webkit"],
  viewports: ["1920x1080"],
};

export type Config = Partial<typeof defaults> & {
  token: string;
};
