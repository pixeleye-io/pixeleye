import {
  CaptureScreenshotOptions,
  captureScreenshot,
} from "@pixeleye/cli-capture";
import { serializedNodeWithId } from "rrweb-snapshot";
import PQueue from "p-queue";
import type { DeviceDescriptor } from "@pixeleye/cli-devices";
import { PartialSnapshot } from "@pixeleye/api";


export type QueuedSnap = Omit<PartialSnapshot, "snapID"> & {
  file: Buffer;
  format: "png";
}

  
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

export const queue = new PQueue({
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  concurrency: Number(process.env.PIXELEYE_BOOTH_CONCURRENCY) || 4,
});

export type HandleSnapshot = CaptureScreenshotOptions & {
  name: string;
  variant?: string;
};

export async function handleQueue({
  body,
  addToBusQueue,
}: {
  body: HandleSnapshot;
  addToBusQueue: (message: QueuedSnap) => Promise<void>;
}) {
  const file: QueuedSnap = await captureScreenshot(body).then((file) => ({
    file,
    format: "png",
    name: body.name,
    variant: body.variant,
    target: body.device.name as string,
    viewport: `${body.device.viewport.width}x${body.device.viewport.height}`,
    targetIcon: body.device.icon,
  }));

  addToBusQueue(file);
}
