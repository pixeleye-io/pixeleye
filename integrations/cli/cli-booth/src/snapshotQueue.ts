import {
  CaptureScreenshotData,
  captureScreenshot,
} from "@pixeleye/cli-capture";
import PQueue from "p-queue";
import { PartialSnapshot } from "@pixeleye/api";
import { removeAsset } from "@pixeleye/cli-asset-server";

export type QueuedSnap = Omit<PartialSnapshot, "snapID"> & {
  file: Buffer;
  format: "png";
};

export const queue = new PQueue({
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  concurrency: Number(process.env.PIXELEYE_BOOTH_CONCURRENCY) || 4,
});

export async function handleQueue({
  body,
  addToBusQueue,
  assetID,
  assetServerURL,
}: {
  body: CaptureScreenshotData;
  addToBusQueue: (message: QueuedSnap) => Promise<void>;
  assetServerURL: string;
  assetID?: string;
}) {
  const file: QueuedSnap = await captureScreenshot(
    body,
    assetServerURL,
    assetID
  ).then((file) => ({
    file,
    format: "png",
    name: body.name,
    variant: body.variant,
    target: body.device.name as string,
    viewport: `${body.device.viewport.width}x${body.device.viewport.height}`,
    targetIcon: body.device.icon,
  }));

  if (assetID) removeAsset(assetID);

  addToBusQueue(file);
}
