import type { Page } from "puppeteer";
import type { Page as PageCore } from "puppeteer-core";
import { loadConfig } from "@pixeleye/cli-config";
import { DeviceDescriptor } from "@pixeleye/cli-devices";
import {
  snapshot,
  Options as ServerOptions,
  SnapshotRequest,
} from "@pixeleye/cli-booth";
import { createRequire } from "node:module";
import { snapshot as rrwebSnapshotFn } from "rrweb-snapshot";
import rrweb from "rrweb-snapshot";

type RRWeb = typeof rrweb;

let rrwebScript: string | undefined;
try {
  rrwebScript = require.resolve("rrweb-snapshot/dist/rrweb-snapshot.min.js");
} catch {
  const require = createRequire(import.meta.url);
  rrwebScript = require.resolve("rrweb-snapshot/dist/rrweb-snapshot.min.js");
}

export interface Options {
  fullPage?: boolean;
  name: string;
  variant?: string;
  selector?: string;
  devices?: DeviceDescriptor[];
  maskSelectors?: string[];
  waitForSelectors?: string[];
  maskColor?: string;
  css?: string;
  wait?: number;
  scale?: "device" | "css";
}

export async function pixeleyeSnapshot(
  page: Page | PageCore,
  options: Options
) {
  if (!page) {
    throw new Error("No Puppeteer page object provided");
  }
  if (!options.name) {
    throw new Error("No name provided");
  }

  // eslint-disable-next-line turbo/no-undeclared-env-vars
  if (!process.env.PIXELEYE_RUNNING)
    return console.log("Skipping snapshot as Pixeleye exec is not running");

  const config = await loadConfig();

  const opts: ServerOptions = {
    endpoint: `http://localhost:${
      // eslint-disable-next-line turbo/no-undeclared-env-vars
      process.env.PIXELEYE_BOOTH_PORT
    }`,
  };

  const css =
    config.css || options.css
      ? `${config.css ?? ""}\n${options.css ?? ""}`
      : undefined;

  await (page as Page).addScriptTag({
    path: rrwebScript,
  });

  if (options.waitForSelectors) {
    for (const selector of options.waitForSelectors) {
      await page.waitForSelector(selector);
    }
  }

  const domSnapshot = await (page as Page).evaluate(() => {
    const r: RRWeb = (window as any).rrwebSnapshot;

    return r.snapshot(document, {
      recordCanvas: true,
      inlineImages: true,
      inlineStylesheet: true,
    });
  });

  if (!domSnapshot) {
    throw new Error("No DOM snapshot available");
  }

  const snap: SnapshotRequest = {
    devices: options.devices ?? config.devices ?? [],
    name: options.name,
    variant: options.variant,
    serializedDom: domSnapshot,
    fullPage: options.fullPage,
    selector: options.selector,
    maskSelectors: options.maskSelectors,
    maskColor: options.maskColor,
    wait: options.wait,
    url: page.url(),
    waitForSelectors: options.waitForSelectors,
    css,
    scale: options.scale || config.scale,
  };

  const res = await snapshot(opts, snap).catch((err) => {
    console.log("Error uploading snapshot", err);
    throw err;
  });

  if (res.status < 200 || res.status >= 300) {
    const data = await res.json();

    throw new Error("Error uploading snapshot, err: " + JSON.stringify(data));
  }
}
