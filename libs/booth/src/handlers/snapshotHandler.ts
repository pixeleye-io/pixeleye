import type { RequestHandler } from "express";
import { captureScreenshot, DeviceDescriptor } from "../capture";
import { serializedNodeWithId } from "@pixeleye/rrweb-snapshot";
import {
  Context,
  uploadSnapshots,
  linkSnapshotsToBuild,
} from "@pixeleye/js-sdk";
import { BoothServerOptions } from "../server";

export interface SnapshotRequest {
  name: string;
  variant?: string;
  serializedDom: serializedNodeWithId;
  selector?: string;
  fullPage?: boolean;
  devices: DeviceDescriptor[];
}

export const currentJobs = new Map<string, boolean>();

export const snapshotHandler =
  ({ endpoint, token, build }: BoothServerOptions): RequestHandler =>
  async (req, res) => {
    const body = req.body as SnapshotRequest;

    const ctx: Context = {
      endpoint,
      token,
      env: process.env,
    };

    const id = crypto.randomUUID();

    currentJobs.set(id, true);

    // No need to await here, we can just fire and forget
    Promise.all(
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
          build,
          ids.map(({ id }, i) => ({
            name: body.name,
            variant: body.variant,
            snapID: id,
            target: body.devices[i].name,
            viewport: `${body.devices[i].viewport.width}x${body.devices[i].viewport.height}`,
          }))
        );
      })
      .finally(() => {
        currentJobs.delete(id);
      });

    res.end("ok");
  };
