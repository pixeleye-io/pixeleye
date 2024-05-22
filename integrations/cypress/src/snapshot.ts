import { DeviceDescriptor } from "@pixeleye/cli-devices";
import { Options as ServerOptions, SnapshotRequest } from "@pixeleye/cli-booth";
import { snapshot as domSnapshot } from "@pixeleye/rrweb-snapshot";

export interface Options {
  fullPage?: boolean;
  name: string;
  variant?: string;
  selector?: string;
  devices?: DeviceDescriptor[];
  maskSelectors?: string[];
  maskColor?: string;
  css?: string;
  wait?: number;
}

export const pixeleyeSnapshot = (options: Options) => {
  if (!options.name) throw new Error("No name provided");

  if (!Cypress.env("PIXELEYE_RUNNING"))
    return cy.log("Skipping snapshot as Pixeleye exec is not running");

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
    const serializedDom = domSnapshot(doc, {
      recordCanvas: true,
      inlineImages: true,
    });
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
      wait: options.wait,
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
