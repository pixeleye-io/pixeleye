import { Browser } from "playwright";
import { SnapshotOptions } from "./types";

async function takeOnBrowser(
  browser: Browser,
  target: string,
  data: SnapshotOptions
) {
  const page = await browser.newPage({
    javaScriptEnabled: false,
  });
  if (data.url) await page.goto(data.url);
  else await page.setContent(data.dom!);

  const buffers = await Promise.all(
    data.viewports.map(async (viewport) => {
      const [width, height] = viewport.split("-").map(Number) as [
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
            fullPage: data.fullPage === undefined || data.fullPage,
            animations: "disabled",
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
