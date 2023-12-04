import { Browser, chromium, firefox, webkit } from "playwright";
import { SnapshotOptions, SnapshotOptionsZod } from "./types";
import { readFileSync } from "fs";
import { join } from "path";
import { takeScreenshots } from "./screenshots";
import express, { NextFunction, Request, Response } from "express";
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
      const [{ id }] = await uploadSnapshot(ctx, [
        {
          file: snap.img,
          name: snap.name,
          format: "image/png",
        },
      ]);

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
      res.status(404).json({ message: err.message }).end();
    })
    .then(() => {
      res.status(200).end();
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

  app.use(
    express.json({
      limit: "1gb",
    })
  );

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).send(err.message);
  });

  app.get("/ping", (_req, res) => {
    pingHandler(res);
  });

  app.post("/snapshot", async (req, res) => {
    const data = await SnapshotOptionsZod.parseAsync(req.body).catch((err) => {
      res.status(400).end(err.message);
    });

    if (!data) return;

    await snapshotHandler(ctx, browsers, data, build, res).catch((err) => {
      res.status(500).json({ message: err.message }).end();
    });

    return res.status(200).end();
  });

  app.get("*", (_req, res) => {
    notFoundHandler(res);
  });

  const server = app.listen(port).on("error", (err) => {
    console.error(err);
    process.exit(1);
  });

  return {
    close: () => server.close(),
  };
}
