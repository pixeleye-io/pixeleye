import { captureScreenshot, getBuildContent } from "@pixeleye/cli-capture";
import { serializedNodeWithId } from "rrweb-snapshot";
import PQueue from "p-queue";
import { API, uploadSnapshots } from "@pixeleye/cli-api";
import type { DeviceDescriptor } from "@pixeleye/cli-devices";

export interface SnapshotRequest {
  name: string;
  variant?: string;
  serializedDom?: serializedNodeWithId;
  waitForSelector?: string;
  url?: string;
  selector?: string;
  fullPage?: boolean;
  devices: DeviceDescriptor[];
  maskSelectors?: string[];
  maskColor?: string;
  css?: string;
}

export const queue = new PQueue({ concurrency: 6 });

export async function handleQueue({
  endpoint,
  token,
  body,
  buildID,
  
}: {
  endpoint: string;
  token: string;
  body: SnapshotRequest;
  buildID: string;
}) {
  const api = API({ endpoint, token });

  const content = body.serializedDom
    ? getBuildContent(body.serializedDom)
    : undefined;

  await Promise.all(
    body.devices.map(async (device) => {
      const file = await captureScreenshot({
        device,
        content,
        url: body.url,
        selector: body.selector,
        fullPage: body.fullPage,
        maskSelectors: body.maskSelectors,
        maskColor: body.maskColor,
        waitForSelector: body.waitForSelector,
        css: body.css,
      });

      return {
        file,
        format: "png",
      };
    })
  )
    .then(async (files) => uploadSnapshots(endpoint, token, files))
    .then(
      (ids) =>
        ids.length > 0 &&
        api.post("/v1/client/builds/{id}/upload", {
          params: {
            id: buildID,
          },
          body: {
            snapshots: ids.map(({ id }, i) => ({
              name: body.name,
              variant: body.variant,
              snapID: id,
              target: body.devices[i].name as string,
              viewport: `${body.devices[i].viewport.width}x${body.devices[i].viewport.height}`,
              targetIcon: body.devices[i].icon,
            })),
          },
        })
    );
}
