import {
  createCache,
  createMirror,
  rebuild,
  serializedNodeWithId,
} from "@pixeleye/rrweb-snapshot";
import { JSDOM } from "jsdom";
import { getBrowser, DeviceDescriptor } from "./browsers";

export interface CaptureScreenshotOptions {
  device: DeviceDescriptor;
  url?: string;
  serializedDom?: serializedNodeWithId;
  selector?: string;
  fullPage?: boolean;
}

export async function captureScreenshot(
  options: CaptureScreenshotOptions
): Promise<Buffer> {
  const browser = await getBrowser(options.device);

  const page = await browser.newPage();

  if (options.url) {
    await page.goto(options.url);
  } else if (options.serializedDom) {
    const doc = new JSDOM().window.document;
    const cache = createCache();
    const mirror = createMirror();
    rebuild(options.serializedDom, { doc, cache, mirror });

    await page.setContent(doc.documentElement.outerHTML);
  } else {
    await page.close();
    throw new Error("No url or serializedDom provided");
  }

  await page.waitForLoadState();

  if (options.selector)
    await page.waitForSelector(options.selector, {
      timeout: 60_000,
    });

  const locatedPage = options.selector ? page.locator(options.selector) : page;

  const file = await locatedPage.screenshot({
    fullPage: options.fullPage,
    type: "png",
  });

  await page.close();

  return file;
}
