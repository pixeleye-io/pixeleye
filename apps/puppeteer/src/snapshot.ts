import { Page } from "puppeteer-core";
import { snapshot } from "@chromaui/rrweb-snapshot";
import {
  snapshot as uploadSnapshot,
  Options as ServerOptions,
  SnapshotOptions,
} from "@pixeleye/booth";

export interface Options {
  fullPage?: boolean;
  name: string;
  variant?: string;
}

export async function pixeleyeSnapshot(page: Page, options: Options) {
  if (!page) {
    throw new Error("No Puppeteer page object provided");
  }
  if (!options.name) {
    throw new Error("No name provided");
  }

  const domSnapshot = await page.evaluate(() => {
    /// @ts-ignore
    const doc = document;

    return snapshot(doc);
  });

  const opts: ServerOptions = {
    endpoint: "localhost:3000",
  };

  if (!domSnapshot) {
    throw new Error("No DOM snapshot available");
  }

  const snap: SnapshotOptions = {
    name: options.name,
    viewports: ["1920-1080"],
    targets: ["chromium"],
    dom: domSnapshot,
    fullPage: options.fullPage,
    variant: options.variant,
  };

  const res = await uploadSnapshot(opts, snap);

  if (res.status < 200 || res.status >= 300) {
    throw new Error("Error uploading snapshot");
  }
}
