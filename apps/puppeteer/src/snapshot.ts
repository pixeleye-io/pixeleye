import { Page } from "puppeteer";
import { Page as PageCore } from "puppeteer-core";
import {
  snapshot as uploadSnapshot,
  Options as ServerOptions,
  SnapshotOptions,
} from "@pixeleye/booth";
import { snapshot } from "@chromaui/rrweb-snapshot";
import { defaults, loadConfig } from "@pixeleye/js-sdk";

type SnapshotFn = typeof snapshot;

export interface Options {
  fullPage?: boolean;
  name: string;
  variant?: string;
  browsers?: string[];
  viewports?: string[];
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

  await (page as Page).addScriptTag({
    path: require.resolve(
      "@chromaui/rrweb-snapshot/dist/rrweb-snapshot.min.js"
    ),
  });

  const domSnapshot = await (page as Page).evaluate(() => {
    // @ts-ignore
    const { snapshot } = window.rrwebSnapshot;

    return (snapshot as SnapshotFn)(document);
  });

  const opts: ServerOptions = {
    endpoint: `http://localhost:${
      // eslint-disable-next-line turbo/no-undeclared-env-vars
      process.env.boothPort || defaults.port
    }`,
  };

  if (!domSnapshot) {
    throw new Error("No DOM snapshot available");
  }

  const config = await loadConfig();

  const snap: SnapshotOptions = {
    name: options.name,
    viewports: options.viewports || config.viewports,
    targets: options.browsers || config.browsers,
    dom: domSnapshot,
    fullPage: options.fullPage,
    variant: options.variant,
  };

  const res = await uploadSnapshot(opts, snap);

  if (res.status < 200 || res.status >= 300) {
    const data = await res.json();

    throw new Error("Error uploading snapshot, err: " + JSON.stringify(data));
  }
}
