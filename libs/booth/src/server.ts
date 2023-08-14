import { IncomingMessage, ServerResponse, createServer } from "http";
import { chromium, firefox, webkit } from "playwright";
import { Server } from "socket.io";
import { SnapshotOptions } from "./types";
import { readFileSync } from "fs";
import { join } from "path";
import { takeScreenshots } from "./screenshots";
import {
  Context,
  getAPI,
  linkSnapshotsToBuild,
  uploadSnapshot,
} from "@pixeleye/js-sdk";
import { Build, PartialSnapshot } from "@pixeleye/api";
import { z } from "zod";

function close(io: Server) {
  io.close();
}

interface StartOptions {
  port?: number;
  endpoint: string;
  token: string;
  build: Build;
}

type Res = ServerResponse<IncomingMessage> & {
  req: IncomingMessage;
};

function pingHandler(res: Res) {
  res.writeHead(200);
  res.end("pong");
}

function scriptHandler(res: Res) {
  res.writeHead(200);
  const scriptRoot = require
    .resolve("@chromaui/rrweb-snapshot")
    .replaceAll("\\", "/")
    .replace(/(?<=@chromaui\/rrweb-snapshot).*/, "");

  const script = readFileSync(
    join(scriptRoot, "dist", "rrweb-snapshot.min.js"),
    "utf-8"
  );

  res.end(script);
}

function notFoundHandler(res: Res) {
  res.writeHead(404);
  res.end("Not found");
}

async function snapshotHandler(res: Res) {
  const snaps = await takeScreenshots(browsers, data);

  const uploadSnaps = await Promise.all(
    snaps.map(async (snap) => {
      const { id } = await uploadSnapshot(ctx, snap.img);

      return {
        name: snap.name,
        variant: snap.variant,
        target: snap.target,
        viewport: snap.viewport,
        snapID: id,
      } as PartialSnapshot;
    })
  );

  // TODO - we should handle errors better
  await linkSnapshotsToBuild(ctx, build, uploadSnaps).catch((err) => {
    console.log(err);
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

  const server = createServer(async function (req, res) {
    switch (req.url) {
      case "/ping": {
        return pingHandler(res);
      }
      case "/script": {
        return scriptHandler(res);
      }
      case "/snapshot": {
      }
      default: {
        return notFoundHandler(res);
      }
    }
  });

  const io = new Server(server);
  io.on("connection", (socket) => {
    const ctx: Context = {
      env: process.env,
      endpoint,
      token,
    };
    getAPI(ctx);

    socket.on("snapshot", async (data: SnapshotOptions) => {
      const snaps = await takeScreenshots(browsers, data);

      const uploadSnaps = await Promise.all(
        snaps.map(async (snap) => {
          const { id } = await uploadSnapshot(ctx, snap.img);

          return {
            name: snap.name,
            variant: snap.variant,
            target: snap.target,
            viewport: snap.viewport,
            snapID: id,
          } as PartialSnapshot;
        })
      );

      // TODO - we should handle errors better
      await linkSnapshotsToBuild(ctx, build, uploadSnaps).catch((err) => {
        console.log(err);
      });
    });
  });

  server.listen(port, () => {
    console.log(`listening on *:${port}`);
  });

  return {
    close: () => close(io),
  };
}
