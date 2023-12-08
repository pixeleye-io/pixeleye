import type { RequestHandler } from "express";
import { currentJobs } from "./snapshotHandler";

export const finishedHandler: RequestHandler = (_, res) => {
  const interval = setInterval(() => {
    if (currentJobs.size === 0) {
      clearInterval(interval);
      res.end("ok");
    }
  }, 1000);
};
