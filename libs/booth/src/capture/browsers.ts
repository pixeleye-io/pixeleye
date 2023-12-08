import {
  firefox,
  chromium,
  webkit,
  BrowserContext,
  devices as playwrightDevices,
  LaunchOptions,
} from "playwright";
import hash from "object-hash";

export type PlaywrightDeviceDescriptor =
  (typeof playwrightDevices)["Desktop Chrome"];

export interface DeviceDescriptor extends PlaywrightDeviceDescriptor {
  name: string;
}

export const devices = Object.keys(playwrightDevices).reduce(
  (acc, key) => ({
    ...acc,
    [key]: {
      ...playwrightDevices[key as keyof typeof playwrightDevices],
      name: key,
    },
  }),
  {} as Record<string, DeviceDescriptor>
);

export type Browsers = "firefox" | "chrome" | "edge" | "webkit";

const deviceCache: Record<string, BrowserContext | undefined> = {};

const renderEngines = {
  chromium: chromium,
  firefox: firefox,
  webkit: webkit,
};

function getBrowserArgs(name: keyof typeof devices): LaunchOptions | undefined {
  if (name === "Desktop Chrome") {
    return {
      channel: "chrome",
    };
  } else if (name === "Desktop Firefox") {
    return {
      channel: "firefox",
    };
  }
}

export async function getBrowser(
  deviceDescriptor: DeviceDescriptor
): Promise<BrowserContext> {
  const key = hash(deviceDescriptor);

  if (deviceCache[key]) {
    return deviceCache[key]!;
  }

  const renderer = renderEngines[deviceDescriptor.defaultBrowserType];

  if (!renderer) {
    throw new Error(`Unknown renderer ${deviceDescriptor.defaultBrowserType}`);
  }

  const browser = await renderer.launch(getBrowserArgs(deviceDescriptor.name));

  const context = await browser.newContext(deviceDescriptor);

  deviceCache[deviceDescriptor.name] = context;

  return context;
}
