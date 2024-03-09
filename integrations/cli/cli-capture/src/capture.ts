import {
  createCache,
  createMirror,
  rebuild,
  serializedNodeWithId,
} from "rrweb-snapshot";
import { getBrowser } from "./browsers";
import { DeviceDescriptor } from "@pixeleye/cli-devices";
import { defaultConfig } from "@pixeleye/cli-config";
import { JSDOM } from "jsdom";
import { logger } from "@pixeleye/cli-logger";

export interface CaptureScreenshotOptions {
  device: DeviceDescriptor;
  url?: string;
  content?: string;
  selector?: string;
  fullPage?: boolean;
  waitForSelector?: string;
  maskSelectors?: string[];
  maskColor?: string;
  css?: string;
}

export function getBuildContent(serializedDom: serializedNodeWithId): string {
  const doc = new JSDOM().window.document;
  const cache = createCache();
  const mirror = createMirror();
  rebuild(serializedDom, { doc, cache, mirror });

  return doc.documentElement.outerHTML;
}

export async function captureScreenshot(
  options: CaptureScreenshotOptions
): Promise<Buffer> {
  const browser = await getBrowser(options.device);

  const page = await browser.newPage();

  if (options.url) {
    await page.goto(options.url, {
      timeout: 60_000,
    });
  } else if (options.content) {
    await page.setContent(options.content, {
      timeout: 60_000,
    });
  } else {
    await page.close();
    throw new Error("No url or serializedDom provided");
  }

  if (options.css) {
    // insert css at bottom of body
    await page
      .locator("body")
      .first()
      .evaluate((body, css) => {
        const style = document.createElement("style");
        style.innerHTML = css;
        body.appendChild(style);
        return true;
      }, options.css);
  }

  await page.waitForLoadState();

  await page
    .waitForFunction(() => document.fonts.ready)
    .catch(() => {
      logger.info("Timed out waiting for document fonts to be ready");
    });

  if (options.waitForSelector)
    await page.waitForSelector(options.waitForSelector, {
      timeout: 60_000,
    });

  if (options.selector)
    await page.waitForSelector(options.selector, {
      timeout: 60_000,
    });

  const locatedPage = options.selector ? page.locator(options.selector) : page;

  const mask = [...(options?.maskSelectors || []), "[data-pixeleye-mask]"].map(
    (selector) => locatedPage.locator(selector)
  );

  const file = await locatedPage.screenshot({
    fullPage: options.fullPage,
    type: "png",
    mask,
    maskColor: options?.maskColor || defaultConfig.maskColor,
  });

  await page.close();

  return file;
}
