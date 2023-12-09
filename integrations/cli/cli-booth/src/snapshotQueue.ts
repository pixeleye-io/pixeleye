import { captureScreenshot } from "@pixeleye/cli-capture";
import { serializedNodeWithId } from "rrweb-snapshot";
import PQueue from "p-queue";
import { API, uploadSnapshots } from "@pixeleye/cli-api";
import type { DeviceDescriptor } from "@pixeleye/cli-devices";
import type { DomEnvironment } from "@pixeleye/cli-config";

export interface SnapshotRequest {
  name: string;
  variant?: string;
  serializedDom: serializedNodeWithId;
  selector?: string;
  fullPage?: boolean;
  devices: DeviceDescriptor[];
  maskSelectors?: string[];
  maskColor?: string;
  css?: string;
}

export const queue = new PQueue({ concurrency: 10 });

export async function handleQueue({
  endpoint,
  token,
  body,
  buildID,
  domEnvironment,
}: {
  endpoint: string;
  token: string;
  body: SnapshotRequest;
  buildID: string;
  domEnvironment: DomEnvironment;
}) {
  const api = API({ endpoint, token });

  await Promise.all(
    body.devices.map(async (device) => {
      const file = await captureScreenshot({
        domEnvironment,
        device,
        serializedDom: body.serializedDom,
        selector: body.selector,
        fullPage: body.fullPage,
        maskSelectors: body.maskSelectors,
        maskColor: body.maskColor,
        css: body.css,
      });

      return {
        file,
        format: "png",
      };
    })
  )
    .then(async (files) => uploadSnapshots(endpoint, token, files))
    .then((ids) =>
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
