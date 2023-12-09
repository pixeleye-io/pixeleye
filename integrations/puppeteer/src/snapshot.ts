import type { Page } from "puppeteer";
import type { Page as PageCore } from "puppeteer-core";
import { loadConfig } from "@pixeleye/cli-config";
import { DeviceDescriptor } from "@pixeleye/cli-devices";
import {
  snapshot,
  Options as ServerOptions,
  SnapshotRequest,
} from "@pixeleye/cli-booth";

export interface Options {
  fullPage?: boolean;
  name: string;
  variant?: string;
  selector?: string;
  devices?: DeviceDescriptor[];
  maskSelectors?: string[];
  maskColor?: string;
  css?: string;
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
    path: require.resolve("rrweb-snapshot/dist/rrweb-snapshot.min.js"),
  });

  const domSnapshot = await (page as Page).evaluate(() => {
    // @ts-ignore
    return rrwebSnapshot.snapshot(document);
  });

  if (!domSnapshot) {
    throw new Error("No DOM snapshot available", domSnapshot);
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
