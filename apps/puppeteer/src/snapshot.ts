import { Page } from "puppeteer";
import { Page as PageCore } from "puppeteer-core";
import {
  snapshot as uploadSnapshot,
  Options as ServerOptions,
  SnapshotOptions,
} from "@pixeleye/booth";
import { snapshot } from "@chromaui/rrweb-snapshot";

type SnapshotFn = typeof snapshot;

export interface Options {
  fullPage?: boolean;
  name: string;
  variant?: string;
  port?: number; // Port used by local pixeleye booth server
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
      options.port || process.env.boothPort || 3000
    }`,
  };

  if (!domSnapshot) {
    throw new Error("No DOM snapshot available");
  }

  const snap: SnapshotOptions = {
    name: options.name,
    viewports: ["1920x1080"],
    targets: ["chromium"],
    dom: domSnapshot,
    fullPage: options.fullPage,
    variant: options.variant,
  };

  const res = await uploadSnapshot(opts, snap);

  console.log(res);

  if (res.status < 200 || res.status >= 300) {
    const data = await res.json();

    console.log(data);

    throw new Error("Error uploading snapshot, err: " + JSON.stringify(data));
  }
}
