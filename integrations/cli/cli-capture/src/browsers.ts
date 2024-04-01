import { chromium, firefox, webkit, Browser, Page } from "playwright-core";
import { DeviceDescriptor } from "@pixeleye/cli-devices";
import hash from "object-hash";

const browserCache: Record<string, Browser | undefined> = {};

const renderEngines = {
  chromium: chromium,
  firefox: firefox,
  webkit: webkit,
};

export async function getBrowser(
  deviceDescriptor: DeviceDescriptor
): Promise<Browser> {
  const key = hash(deviceDescriptor.defaultBrowserType);

  if (browserCache[key]) {
    return browserCache[key]!;
  }

  const renderer = renderEngines[deviceDescriptor.defaultBrowserType];

  if (!renderer) {
    throw new Error(`Unknown renderer ${deviceDescriptor.defaultBrowserType}`);
  }

  const browser = await renderer.launch({
    headless: true,
  });

  browserCache[key] = browser;

  return browser;
}

export async function getPage(
  deviceDescriptor: DeviceDescriptor
): Promise<Page> {
  const browser = await getBrowser(deviceDescriptor);
  return browser.newPage({
    ...deviceDescriptor,
    javaScriptEnabled: deviceDescriptor.javaScriptEnabled ?? false,
  });
}
