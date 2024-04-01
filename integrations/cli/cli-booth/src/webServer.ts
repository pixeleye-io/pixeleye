import polka from "polka";
import type { SerializeResult } from "@pixeleye/cli-dom";
import getPort from "get-port";
import { randomUUID } from "node:crypto";

const assetMap = new Map<string, SerializeResult & { ttl: number }>();

export function addAsset(asset: SerializeResult, ttl: number) {
  const id = randomUUID();
  assetMap.set(id, { ...asset, ttl });
  return id;
}

export function removeAsset(id: string) {
  const asset = assetMap.get(id);

  if (!asset) {
    return;
  }

  if (asset.ttl > 1) {
    assetMap.set(id, { ...asset, ttl: asset.ttl - 1 });
    return;
  }
  assetMap.delete(id);
}

export function startWebServer() {
  const app = polka();

  app.get("/page/:id", (req, res) => {
    const asset = assetMap.get(req.params.id);

    if (!asset) {
      res.statusCode = 404;
      res.end("Asset not found");
      return;
    }

    res.end(asset.html);
  });

  //   app.get("/page/:id/resource", (req, res) => {
  //     const asset = assetMap.get(req.params.id);

  //     const url = req.query.url as string;

  //     if (!asset) {
  //       res.statusCode = 404;
  //       res.end("Asset not found");
  //       return;
  //     }

  //     const resource = asset.resources.find((r) => r.url === url);

  //     if (!resource) {
  //       res.statusCode = 404;
  //       res.end("Resource not found");
  //       return;
  //     }

  //     res.setHeader("Content-Type", resource?.mimeType || "text/plain");
  //     res.end(resource?.content || "");
  //   });

  const port = getPort();

  app.listen(port, () => {
    console.log("Web server started on http://localhost:3000");
  });

  return {
    close: () => app.server?.close(),
    port,
    url: `http://localhost:${port}`,
  };
}
