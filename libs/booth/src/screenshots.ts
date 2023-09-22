import { Browser } from "playwright";
import { SnapshotOptions } from "./types";
import { JSDOM } from "jsdom";
import { createCache, createMirror, rebuild } from "@chromaui/rrweb-snapshot";

async function takeOnBrowser(
  browser: Browser,
  target: string,
  data: SnapshotOptions
) {
  const page = await browser.newPage({
    javaScriptEnabled: false,
  });

  if (data.url) await page.goto(data.url);
  else {
    const doc = new JSDOM().window.document;
    const cache = createCache();
    const mirror = createMirror();
    rebuild(data.dom!, { doc, cache, mirror });

    await page.setContent(doc.documentElement.outerHTML);
  }

  const buffers = await Promise.all(
    data.viewports.map(async (viewport) => {
      const [width, height] = viewport.split("x").map(Number) as [
        number,
        number,
      ];
      return page
        .setViewportSize({
          width,
          height,
        })
        .then(async () => ({
          img: await page.screenshot({
            fullPage: data.fullPage ?? true,
            animations: "disabled",
            type: "png",
          }),
          viewport,
          target,
          name: data.name,
          variant: data.variant,
        }));
    })
  );
  return buffers;
}

export async function takeScreenshots(
  browsers: Record<string, Browser>,
  data: SnapshotOptions
) {
  return Promise.all(
    data.targets.map((target) => takeOnBrowser(browsers[target], target, data))
  ).then((data) => data.flat());
}
