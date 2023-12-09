import type { RequestHandler } from "express";
import { queue } from "./snapshotHandler";

export const finishedHandler: RequestHandler = (_, res) => {
  queue.onIdle().then(() => {
    res.end("ok");
  });
};
