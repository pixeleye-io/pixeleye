import {
  createCache,
  createMirror,
  rebuild,
  serializedNodeWithId,
} from "rrweb-snapshot";
import { getPage } from "./browsers";
import { DeviceDescriptor } from "@pixeleye/cli-devices";
import { SnapshotDefinition, defaultConfig } from "@pixeleye/cli-config";
import { JSDOM } from "jsdom";
import { logger } from "@pixeleye/cli-logger";
import { Page } from "playwright-core";
import { SerializedDom } from "@pixeleye/cli-dom";

type Only<T, U> = {
  [P in keyof T]: T[P];
} & {
  [P in keyof U]?: never;
};

type Either<T, U> = Only<T, U> | Only<U, T>;

export interface CaptureScreenshotConfigOptions
  extends Omit<SnapshotDefinition, "url" | "name"> {
  device: DeviceDescriptor;
  name: string;
}

export type CaptureScreenshotData<
  T extends string | number | symbol | undefined = undefined,
> = T extends string | number | symbol
  ? Omit<CaptureScreenshotConfigOptions, T>
  : CaptureScreenshotConfigOptions &
      Either<
        { url: string },
        { serializedDom: SerializedDom & { url: string } }
      >;

export function getBuildContent(serializedDom: serializedNodeWithId): string {
  const doc = new JSDOM().window.document;
  const cache = createCache();
  const mirror = createMirror();
  rebuild(serializedDom, { doc, cache, mirror });

  return doc.documentElement.outerHTML;
}

const retries = 3;

export async function captureScreenshot(
  options: CaptureScreenshotData,
  assetServerURL: string,
  assetID?: string
): Promise<Buffer> {
  const page = await getPage(options.device);

  let error: Error | undefined;

  return new Promise(async (resolve, reject) => {
    for (let i = 0; i < retries; i++) {
      const buffer = await internalCaptureScreenshot(
        page,
        options,
        assetServerURL,
        assetID
      ).catch((err) => {
        logger.error(err);
        error = err;
      });

      if (buffer) {
        await page.close();
        return resolve(buffer);
      }
    }

    await page.close();

    logger.error(`Failed to capture screenshot after ${retries} retries`);

    reject(error);
  });
}

async function internalCaptureScreenshot(
  page: Page,
  data: CaptureScreenshotData,
  assetServerURL: string,
  assetID?: string
): Promise<Buffer> {
  if (assetID) {
    if (!data.serializedDom) {
      throw new Error("Asset ID provided but no serializedDom");
    }

    // We have been given a serialized dom, so we need to go to our asset server

    const pageURL = `${assetServerURL}/page/${assetID}`;

    await page.route("**/*", (route) => {
      if (
        !route.request().url().startsWith(assetServerURL) ||
        route.request().url() === pageURL ||
        route.request().url() === pageURL + "/"
      )
        return route.continue();

      const url = new URL(route.request().url());

      url.pathname = `/asset/${assetID}${url.pathname}`;

      return route.continue({
        url: url.toString(),
      });
    });

    await page.goto(pageURL, {
      timeout: 60_000,
      waitUntil: "domcontentloaded",
    });
  } else if (data.url) {
    await page.goto(data.url, {
      timeout: 60_000,
      waitUntil: "domcontentloaded",
    });
  } else {
    await page.close();
    throw new Error("No url or serializedDom provided");
  }

  if (data.css) {
    // insert css at bottom of body
    await page
      .locator("body")
      .first()
      .evaluate((body, css) => {
        const style = document.createElement("style");
        style.innerHTML = css;
        body.appendChild(style);
        return true;
      }, data.css);
  }

  await page.waitForLoadState();

  await page
    .waitForFunction(() => document.fonts.ready)
    .catch(() => {
      logger.info("Timed out waiting for document fonts to be ready");
    });

  if (data.waitForSelectors && data.waitForSelectors.length > 0)
    Promise.all(
      data.waitForSelectors.map((selector) =>
        page.waitForSelector(selector, {
          timeout: 60_000,
        })
      )
    );

  if (data.selector)
    await page.waitForSelector(data.selector, {
      timeout: 60_000,
    });

  await page.waitForTimeout((data.wait || 0) + 250);

  const locatedPage = data.selector ? page.locator(data.selector) : page;

  const mask = [...(data?.maskSelectors || []), "[data-pixeleye-mask]"].map(
    (selector) => locatedPage.locator(selector)
  );

  const file = await locatedPage.screenshot({
    fullPage: data.fullPage,
    type: "png",
    mask,
    maskColor: data?.maskColor || defaultConfig.maskColor,
  });

  await page.close();

  return file;
}
