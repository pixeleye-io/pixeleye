import { Page } from "puppeteer-core";
import { snapshot } from "@chromaui/rrweb-snapshot";

export interface Options {}

export default async function pixeleyeSnapshot(
  page: Page,
  name: string,
  options: Options = {}
) {
  if (!page) {
    throw new Error("No Puppeteer page object provided");
  }
  if (!name) {
    throw new Error("No name provided");
  }

  const domSnapshot = await page.evaluate(() => {
    /// @ts-ignore
    const doc = document;

    return snapshot(doc);
  });
}
