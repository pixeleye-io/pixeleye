import { Config } from "./types";

export function getEnvConfig(
  envFn?: (name: string) => string | undefined
): Config {
  if (!envFn) {
    envFn = (name) => process.env[name];
  }

  return {
    token: envFn("PIXELEYE_TOKEN") || "",
    boothPort: envFn("PIXELEYE_BOOTH_PORT"),
    endpoint: envFn("PIXELEYE_ENDPOINT"),
    css: envFn("PIXELEYE_CSS"),
    devices: JSON.parse(envFn("PIXELEYE_DEVICES") || "") as Config["devices"],
    maskColor: envFn("PIXELEYE_MASK_COLOR"),
    storybookOptions: JSON.parse(
      envFn("PIXELEYE_STORYBOOK_OPTIONS") || ""
    ) as Config["storybookOptions"],
  };
}
