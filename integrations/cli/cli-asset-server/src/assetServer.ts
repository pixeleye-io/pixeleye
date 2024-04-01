import polka from "polka";
import type { SerializedDom } from "@pixeleye/cli-dom";
import getPort from "get-port";
import { randomUUID } from "node:crypto";

export type SerializedDomWithURL = SerializedDom & {
  url: string;
};

const assetMap = new Map<string, SerializedDomWithURL & { ttl: number }>();

export function addAsset(asset: SerializedDomWithURL, ttl: number) {
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

export async function startAssetServer() {
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

  app.get("/asset/:id/*", (req, res) => {
    const asset = assetMap.get(req.params.id);

    if (!asset) {
      res.statusCode = 404;
      res.end("Asset not found");
      return;
    }

    // TODO - we need to find the resource in the asset and return it for custom resources

    // Redirect to the original resource
    const assetURL = new URL(
      req.url.replace(`/asset/${req.params.id}/`, "/"),
      asset.url
    );

    res.statusCode = 302;
    res.setHeader("Location", assetURL.toString());
    res.end();
  });

  const port = await getPort();

  app.listen(port, () => {
    console.log("Web server started on port:", port);
  });

  return {
    close: () => app.server?.close(),
    port,
    url: `http://localhost:${port}`,
  };
}
