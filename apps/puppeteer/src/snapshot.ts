import { Page } from "puppeteer";
import { Page as PageCore } from "puppeteer-core";
import {
  snapshot as uploadSnapshot,
  Options as ServerOptions,
  SnapshotOptions,
} from "@pixeleye/booth";
import { defaults, loadConfig } from "@pixeleye/js-sdk";
import { env } from "./env";



export interface Options {
  fullPage?: boolean;
  name: string;
  variant?: string;
  browsers?: string[];
  viewports?: string[];
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
      env.boothPort || defaults.port
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

  const config = (await loadConfig());

  const snap: SnapshotOptions = {
    name: options.name,
    viewports: options.viewports || config.viewports || [],
    targets: options.browsers || config.browsers || [],
    dom: domSnapshot,
    fullPage: options.fullPage,
    variant: options.variant,
    selector: options.selector,
  };

  const res = await uploadSnapshot(opts, snap).catch((err) => {
    console.log("Error uploading snapshot", err);
    throw err;
  });

  if (res.status < 200 || res.status >= 300) {
    const data = await res.json().catch(() => res.statusText);
    throw new Error("Error uploading snapshot, err: " + JSON.stringify(data));
  }
}
