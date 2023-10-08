const config = "./pixeleye.config.js";
const endpoint = "https://pixeleye.io";
const port = 3003;

const browsers = ["chromium", "firefox", "webkit"];
const viewports = ["1920x1080"];

export const defaults = {
  config,
  endpoint,
  port,
  browsers,
  viewports,
  token: "",
};
