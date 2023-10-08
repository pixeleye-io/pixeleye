import { Page } from "puppeteer";
import { Page as PageCore } from "puppeteer-core";
import {
  snapshot as uploadSnapshot,
  Options as ServerOptions,
  SnapshotOptions,
} from "@pixeleye/booth";
import * as rrweb from "rrweb-snapshot";
import { defaults, loadConfig } from "@pixeleye/js-sdk";

export interface Options {
  fullPage?: boolean;
  name: string;
  variant?: string;
  browsers?: string[];
  viewports?: string[];
  config?: Partial<Awaited<ReturnType<typeof loadConfig>>>;
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

  // await page.exposeFunction("snapshot", (document: Document) =>
  //   rrweb.snapshot(document)
  // );

  interface WindowWithSnapshot extends Window {
    rrwebSnapshot: { snapshot: typeof rrweb.snapshot };
  }

  const content = await fetch(
    "https://unpkg.com/rrweb-snapshot@2.0.0-alpha.11/es/rrweb-snapshot.js"
  ).then((res) => res.text());

  await page.addScriptTag({
    content: content + "window.snapshot = snapshot;\n",
    type: "module",
  });

  const domSnapshot = await (page as Page).evaluate(async () => {
    const { snapshot } = window as any;
    return snapshot(document);
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

  const config = options.config || (await loadConfig());

  const snap: SnapshotOptions = {
    name: options.name,
    viewports: options.viewports || config.viewports || [],
    targets: options.browsers || config.browsers || [],
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
