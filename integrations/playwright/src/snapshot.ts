import type { Page } from "playwright-core";
import { getEnvConfig } from "@pixeleye/cli-config";
import { DeviceDescriptor } from "@pixeleye/cli-devices";
import {
  snapshot,
  Options as ServerOptions,
  SnapshotRequest,
} from "@pixeleye/cli-booth";
import { createRequire } from "node:module";
import rrweb from "rrweb-snapshot";

let rrwebScript: string | undefined;
try {
  rrwebScript = require.resolve("rrweb-snapshot/dist/rrweb-snapshot.min.js");
} catch {
  const require = createRequire(import.meta.url);
  rrwebScript = require.resolve("rrweb-snapshot/dist/rrweb-snapshot.min.js");
}

type RRWeb = typeof rrweb;

export interface Options {
  name: string;
  fullPage?: boolean;
  variant?: string;
  selector?: string;
  /**
   * @deprecated use {@link Options.waitForSelectors} instead
   */
  waitForSelector?: string;
  waitForSelectors?: string[];
  devices?: DeviceDescriptor[];
  maskSelectors?: string[];
  maskColor?: string;
  css?: string;
  wait?: number;
}

export async function pixeleyeSnapshot(page: Page, options: Options) {
  if (!page) {
    throw new Error("No playwright page object provided");
  }
  if (!options.name) {
    throw new Error("No name provided");
  }

  // eslint-disable-next-line turbo/no-undeclared-env-vars
  if (!process.env.PIXELEYE_RUNNING)
    return console.log("Skipping snapshot as Pixeleye exec is not running");

  const config = await getEnvConfig();

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

  // TODO remove in next major release
  if (options.waitForSelector) {
    options.waitForSelectors = [
      options.waitForSelector,
      ...(options.waitForSelectors ?? []),
    ];
  }

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
    waitForSelectors: options.waitForSelectors,
    css,
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
