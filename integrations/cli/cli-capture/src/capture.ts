import { getPage } from "./browsers";
import { DeviceDescriptor } from "@pixeleye/cli-devices";
import { SnapshotDefinition, defaultConfig } from "@pixeleye/cli-config";
import { logger } from "@pixeleye/cli-logger";
import { Page } from "playwright-core";

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
      Either<{ url: string }, { content: string }>;

const retries = 3;

export async function captureScreenshot(
  options: CaptureScreenshotData & { webServerURL: string; pageID?: string }
): Promise<Buffer> {
  const page = await getPage(options.device);

  let error: Error | undefined;

  return new Promise(async (resolve, reject) => {
    for (let i = 0; i < retries; i++) {
      const buffer = await internalCaptureScreenshot(page, options).catch(
        (err) => {
          logger.error(err);
          error = err;
        }
      );

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
  data: CaptureScreenshotData & { webServerURL: string; pageID?: string }
): Promise<Buffer> {
  if (data.content) {
    await page.route(
      () => true,
      (route, request) => {
        if (!request.url().startsWith(data.webServerURL))
          return route.continue();

        const url = new URL(request.url());
        const base = new URL(data.url!);
        url.hostname = base.hostname;

        return route.continue({
          url: url.toString(),
        });
      }
    );

    await page.goto(`${data.webServerURL}/page/${data.pageID}`, {
      timeout: 60_000,
      waitUntil: "domcontentloaded",
    });
  } else if (data.url) {
    await page.goto(data.url, {
      timeout: 60_000,
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

  await page.waitForLoadState("load");
  await page.waitForLoadState("domcontentloaded");

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

  // small wait to ensure all content is loaded
  await page.waitForTimeout(data.wait || 0 + 100);

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
