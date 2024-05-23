import rrweb, { serializedNodeWithId } from "rrweb-snapshot";
import { getPage } from "./browsers";
import { DeviceDescriptor } from "@pixeleye/cli-devices";
import { SnapshotDefinition, defaultConfig } from "@pixeleye/cli-config";
import { logger } from "@pixeleye/cli-logger";
import { Page } from "playwright-core";
import { createRequire } from "module";

let rrwebScript: string | undefined;
try {
  rrwebScript = require.resolve("rrweb-snapshot/dist/rrweb-snapshot.min.js");
} catch {
  const require = createRequire(import.meta.url);
  rrwebScript = require.resolve("rrweb-snapshot/dist/rrweb-snapshot.min.js");
}

type RRWeb = typeof rrweb;

const blankPage = "<!DOCTYPE html><html><head></head><body></body></html>";

export interface CaptureScreenshotData
  extends Omit<SnapshotDefinition, "url" | "name"> {
  device: DeviceDescriptor;
  name: string;
  url: string;
  serializedDom?: serializedNodeWithId;
}

const retries = 3;

export async function captureScreenshot(
  options: CaptureScreenshotData
): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    let error: Error | undefined;

    for (let i = 0; i < retries; i++) {
      const page = await getPage(options.device);

      const buffer = await internalCaptureScreenshot(page, options).catch(
        (err) => {
          logger.error(err);
          error = err;
        }
      );

      await page.close();

      if (buffer) {
        return resolve(buffer);
      }
    }

    logger.error(`Failed to capture screenshot after ${retries} retries`);

    reject(error);
  });
}

async function internalCaptureScreenshot(
  page: Page,
  data: CaptureScreenshotData
): Promise<Buffer> {
  if (!data.url) throw new Error("No url provided");

  if (data.serializedDom) {
    await page.route(
      "**/*",
      (route) => {
        route.fulfill({
          status: 200,
          contentType: "text/html",
          body: blankPage,
        });
      },
      {
        times: 1,
      }
    );

    await page.goto(data.url, {
      timeout: 60_000,
      waitUntil: "domcontentloaded",
    });

    await (page as Page).addScriptTag({
      path: rrwebScript,
    });

    await page.evaluate((serializedDom) => {
      const r: RRWeb = (window as any).rrwebSnapshot;

      const cache = r.createCache();
      const mirror = r.createMirror();

      r.rebuild(serializedDom, {
        doc: document,
        cache,
        mirror,
      });
    }, data.serializedDom);
  } else {
    await page.goto(data.url, {
      timeout: 60_000,
    });
  }

  // We want to start waiting for network idle as soon as possible
  const awaiters: Promise<unknown>[] = [page.waitForLoadState("networkidle")];

  await page.waitForLoadState("load");
  await page.waitForLoadState("domcontentloaded");

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

  awaiters.push(
    page
      .waitForFunction(() => document.fonts.ready)
      .catch(() => {
        logger.info("Timed out waiting for document fonts to be ready");
      })
  );

  if (data.waitForSelectors && data.waitForSelectors.length > 0)
    awaiters.push(
      ...data.waitForSelectors.map((selector) =>
        page.waitForSelector(selector, {
          timeout: 60_000,
        })
      )
    );

  if (data.selector)
    awaiters.push(
      page.waitForSelector(data.selector, {
        timeout: 60_000,
      })
    );

  if (data.wait) awaiters.push(page.waitForTimeout(data.wait));

  await Promise.all(awaiters);

  const locatedPage = data.selector ? page.locator(data.selector) : page;

  const mask = [...(data?.maskSelectors || []), "[data-pixeleye-mask]"].map(
    (selector) => locatedPage.locator(selector)
  );

  const file = await locatedPage.screenshot({
    fullPage: data.fullPage,
    type: "png",
    mask,
    maskColor: data?.maskColor || defaultConfig.maskColor,
    timeout: 60_000,
  });

  await page.close();

  return file;
}
