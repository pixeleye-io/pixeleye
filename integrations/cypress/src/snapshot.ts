import { DeviceDescriptor } from "@pixeleye/cli-devices";
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

export const pixeleyeSnapshot = (options: Options) => {
  if (!options.name) {
    throw new Error("No name provided");
  }

  const opts: ServerOptions = {
    endpoint: `http://localhost:${Cypress.env("PIXELEYE_BOOTH_PORT")}`,
  };

  const configCSS = Cypress.env("PIXELEYE_CSS") || "";

  const devices = Cypress.env("PIXELEYE_DEVICES");

  const css =
    configCSS || options.css
      ? `${configCSS ?? ""}\n${options.css ?? ""}`
      : undefined;

  return cy.document().then(async (doc) => {
    const serializedDom = domSnapshot(doc);
    if (!serializedDom) {
      throw new Error("Failed to serialize DOM");
    }
    const snap: SnapshotRequest = {
      devices: options.devices ?? devices ?? [],
      name: options.name,
      variant: options.variant,
      selector: options.selector,
      maskSelectors: options.maskSelectors,
      maskColor: options.maskColor,
      css,
      serializedDom,
      fullPage: options.fullPage,
    };

    cy.request({
      url: `${opts.endpoint}/snapshot`,
      method: "POST",
      body: JSON.stringify(snap),
      headers: {
        "Content-Type": "application/json",
      },
    }).then((res) => {
      if (res.status < 200 || res.status >= 300) {
        throw new Error(
          `Failed to snapshot: ${res.status}, ${JSON.stringify(res.body)}`
        );
      }
    });
  });
};
