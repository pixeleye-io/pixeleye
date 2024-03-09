import polka from "polka";
import bodyParser from "body-parser";
import { Build } from "@pixeleye/api";
import { getEnvConfig } from "@pixeleye/cli-config";
import {
  QueuedSnap,
  SnapshotRequest,
  handleQueue,
  queue,
} from "./snapshotQueue";
import { getBrowser, getBuildContent } from "@pixeleye/cli-capture";
import { createBus } from "./bus";
import { API, uploadSnapshots } from "@pixeleye/cli-api";

export interface BoothServerOptions {
  port: number;
  endpoint: string;
  token: string;
  buildID: Build["id"];
}

// We want to warm up the browsers in the pixeleye.config.js file to speed up the first snapshot
function warmUpBrowsers() {
  const devices = getEnvConfig().devices;

  if (!devices) {
    return;
  }

  for (const device of devices) {
    getBrowser(device);
  }
}

export function startServer(options: BoothServerOptions) {
  return new Promise<{
    close: () => void;
  }>((resolve, _) => {
    const api = API({ endpoint: options.endpoint, token: options.token });

    const bus = createBus<QueuedSnap>({
      batchSize: 10,
      delay: 5_000,
      handler: async (snapshots) => {
        await uploadSnapshots(options.endpoint, options.token, snapshots).then(
          (ids) =>
            ids.length > 0 &&
            api.post("/v1/client/builds/{id}/upload", {
              params: {
                id: options.buildID,
              },
              body: {
                snapshots: snapshots.map((body, i) => ({
                  name: body.name,
                  variant: body.variant,
                  snapID: ids[i].id,
                  target: body.target,
                  viewport: body.viewport,
                  targetIcon: body.targetIcon,
                })),
              },
            })
        );
      },
    });

    const app = polka().use(
      bodyParser.json({
        limit: "100mb",
      })
    );

    // pre load the browsers we know we will use
    warmUpBrowsers();

    app.get("/ping", (_, res) => {
      res.end("pong");
    });

    app.post("/snapshot", (req, res) => {
      const body = req.body as SnapshotRequest;

      const content = body.serializedDom
        ? getBuildContent(body.serializedDom)
        : undefined;

      body.devices.forEach((device) => {
        queue.add(async () =>
          handleQueue({
            ...options,
            body: {
              device,
              content,
              ...body,
            },
            addToBusQueue: bus.add,
          })
        );
      });

      res.end("ok");
    });

    app.get("/finished", async (_, res) => {
      await queue.onIdle();

      await bus.hurryAndWait();

      res.end("ok");
    });

    app.listen(options.port, () => {
      resolve({
        close: () => app.server?.close(),
      });
    });
  });
}
