import { Browser, chromium, firefox, webkit } from "playwright";
import { SnapshotOptions, SnapshotOptionsZod } from "./types";
import { readFileSync } from "fs";
import { join } from "path";
import { takeScreenshots } from "./screenshots";
import express, { Response } from "express";
import {
  Context,
  getAPI,
  linkSnapshotsToBuild,
  uploadSnapshot,
} from "@pixeleye/js-sdk";
import { Build, PartialSnapshot } from "@pixeleye/api";

interface StartOptions {
  port?: number;
  endpoint: string;
  token: string;
  build: Build;
}

function pingHandler(res: Response) {
  res.writeHead(200);
  res.end("pong");
}


function notFoundHandler(res: Response) {
  res.writeHead(404);
  res.end("Not found");
}

async function snapshotHandler(
  ctx: Context,
  browsers: Record<string, Browser>,
  data: SnapshotOptions,
  build: Build,
  res: Response
) {
  const snaps = await takeScreenshots(browsers, data);

  const uploadSnaps = await Promise.all(
    snaps.map(async (snap) => {
      const { id } = await uploadSnapshot(ctx, snap.img, "image/png");

      return {
        name: snap.name,
        variant: snap.variant,
        target: snap.target,
        viewport: snap.viewport,
        snapID: id,
      } as PartialSnapshot;
    })
  );

  await linkSnapshotsToBuild(ctx, build, uploadSnaps)
    .catch((err) => {
      res.writeHead(404);
      res.end(err);
    })
    .then(() => {
      res.writeHead(200);
      res.end();
    });
}

export async function start({
  port = 3003,
  endpoint,
  token,
  build,
}: StartOptions) {
  const browsers = await Promise.all([
    chromium.launch(),
    firefox.launch(),
    webkit.launch(),
  ]).then(([chromium, firefox, webkit]) => ({
    chromium,
    firefox,
    webkit,
  }));

  const ctx: Context = {
    env: process.env,
    endpoint,
    token,
  };
  getAPI(ctx);

  const app = express();

  app.use(express.json());

  app.get("/ping", (_req, res) => {
    pingHandler(res);
  });

  app.post("/snapshot", (req, res) => {
    const data = SnapshotOptionsZod.parse(req.body);

    snapshotHandler(ctx, browsers, data, build, res);
  });

  app.get("*", (_req, res) => {
    notFoundHandler(res);
  });

  const server = app.listen(port, () => {
    console.log(`@pixeleye/booth listening on port ${port}`);
  });

  return {
    close: () => server.close(),
  };
}
