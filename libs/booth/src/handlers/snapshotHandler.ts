import type { RequestHandler } from "express";
import { captureScreenshot, DeviceDescriptor } from "../capture";
import { serializedNodeWithId } from "@pixeleye/rrweb-snapshot";
import {
  Context,
  uploadSnapshots,
  linkSnapshotsToBuild,
} from "@pixeleye/js-sdk";
import { BoothServerOptions } from "../server";
import PQueue from "p-queue";

export interface SnapshotRequest {
  name: string;
  variant?: string;
  serializedDom: serializedNodeWithId;
  selector?: string;
  fullPage?: boolean;
  devices: DeviceDescriptor[];
}

export const queue = new PQueue({ concurrency: 10 });

async function handleQueue({
  ctx,
  body,
  buildID,
}: {
  ctx: Context;
  body: SnapshotRequest;
  buildID: string;
}) {
  await Promise.all(
    body.devices.map(async (device) => {
      const file = await captureScreenshot({
        device,
        serializedDom: body.serializedDom,
        selector: body.selector,
        fullPage: body.fullPage,
      });

      return {
        file,
        format: "png",
      };
    })
  )
    .then(async (files) => uploadSnapshots(ctx, files))
    .then((ids) => {
      return linkSnapshotsToBuild(
        ctx,
        buildID,
        ids.map(({ id }, i) => ({
          name: body.name,
          variant: body.variant,
          snapID: id,
          target: body.devices[i].name,
          viewport: `${body.devices[i].viewport.width}x${body.devices[i].viewport.height}`,
        }))
      );
    });
}

export const snapshotHandler =
  ({ endpoint, token, buildID }: BoothServerOptions): RequestHandler =>
  async (req, res) => {
    const body = req.body as SnapshotRequest;

    const ctx: Context = {
      endpoint,
      token,
      env: process.env,
    };

    queue.add(async () => handleQueue({ ctx, body, buildID }));

    res.end("ok");
  };
