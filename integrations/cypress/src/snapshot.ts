import { loadConfig } from "@pixeleye/cli-config";
import { DeviceDescriptor } from "@pixeleye/cli-devices";
import "cypress";
import {
  Options as ServerOptions,
  SnapshotRequest,
  snapshot,
} from "@pixeleye/cli-booth";
import { snapshot as domSnapshot } from "rrweb-snapshot";

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

function pixeleyeSnapshot(options: Options) {
  if (!options.name) {
    throw new Error("No name provided");
  }

  const opts: ServerOptions = {
    endpoint: `http://localhost:${
      // eslint-disable-next-line turbo/no-undeclared-env-vars
      process.env.PIXELEYE_BOOTH_PORT
    }`,
  };

  return cy.document().then(async (doc) => {
    const config = await loadConfig();

    const css =
      config.css || options.css
        ? `${config.css ?? ""}\n${options.css ?? ""}`
        : undefined;

    const serializedDom = domSnapshot(doc);
    if (!serializedDom) {
      throw new Error("Failed to serialize DOM");
    }

    const snap: SnapshotRequest = {
      devices: options.devices ?? config.devices ?? [],
      name: options.name,
      variant: options.variant,
      selector: options.selector,
      maskSelectors: options.maskSelectors,
      maskColor: options.maskColor,
      css,
      serializedDom,
      fullPage: options.fullPage,
    };

    await snapshot(
      {
        endpoint: opts.endpoint,
      },
      snap
    )
      .catch((err) => {
        throw new Error(`Failed to snapshot: ${err.message}`);
      })
      .then((res) => {
        if (res.status < 200 || res.status >= 300) {
          throw new Error(
            `Failed to snapshot: ${res.status}, ${JSON.stringify(res.json())}`
          );
        }
      });
  });
}

Cypress.Commands.add("pixeleyeSnapshot", pixeleyeSnapshot);
