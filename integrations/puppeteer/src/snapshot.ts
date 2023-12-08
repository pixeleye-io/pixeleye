import { Page } from "puppeteer";
import { Page as PageCore } from "puppeteer-core";
import {
  snapshot as uploadSnapshot,
  Options as ServerOptions,
  SnapshotRequest,
  devices,
} from "@pixeleye/booth";
import { defaults, loadConfig } from "@pixeleye/js-sdk";

// type SnapshotFn = typeof snapshot;

export interface Options {
  fullPage?: boolean;
  name: string;
  variant?: string;
  browsers?: string[];
  viewports?: string[]; // TODO change this to devices
  selector?: string;
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

  const opts: ServerOptions = {
    endpoint: `http://localhost:${
      // eslint-disable-next-line turbo/no-undeclared-env-vars
      process.env.boothPort || defaults.boothPort
    }`,
  };

  await (page as Page).addScriptTag({
    path: require.resolve(
      "@pixeleye/rrweb-snapshot/dist/rrweb-snapshot.min.js"
    ),
  });

  const domSnapshot = await (page as Page).evaluate(() => {
    // @ts-ignore
    return rrwebSnapshot.snapshot(document);
  });

  if (!domSnapshot) {
    throw new Error("No DOM snapshot available", domSnapshot);
  }

  const snap: SnapshotRequest = {
    devices: [devices["Desktop Firefox"]],
    name: options.name,
    variant: options.variant,
    serializedDom: domSnapshot,
    fullPage: options.fullPage,
    selector: options.selector,
  };

  const res = await uploadSnapshot(opts, snap).catch((err) => {
    console.log("Error uploading snapshot", err);
    throw err;
  });

  if (res.status < 200 || res.status >= 300) {
    const data = await res.json();

    throw new Error("Error uploading snapshot, err: " + JSON.stringify(data));
  }
}
