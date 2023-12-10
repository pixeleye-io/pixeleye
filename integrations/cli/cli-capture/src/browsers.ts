import { chromium, firefox, webkit, BrowserContext } from "playwright";
import { DeviceDescriptor } from "@pixeleye/cli-devices";
import hash from "object-hash";

const deviceCache: Record<string, BrowserContext | undefined> = {};

const renderEngines = {
  chromium: chromium,
  firefox: firefox,
  webkit: webkit,
};

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

  const browser = await renderer.launch();

  const context = await browser.newContext(deviceDescriptor);

  deviceCache[key] = context;

  return context;
}
