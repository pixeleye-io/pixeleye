import polka from "polka";
import { json } from "body-parser";
import { Build } from "@pixeleye/api";
import { DomEnvironment, getEnvConfig } from "@pixeleye/cli-config";
import { SnapshotRequest, handleQueue, queue } from "./snapshotQueue";
import { getBrowser } from "@pixeleye/cli-capture";

export interface BoothServerOptions {
  port: number;
  endpoint: string;
  token: string;
  buildID: Build["id"];
  domEnvironment: DomEnvironment;
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
    const app = polka().use(
      json({
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

      queue.add(async () => handleQueue({ ...options, body }));

      res.end("ok");
    });

    app.get("/finished", (_, res) => {
      queue.onIdle().then(() => {
        res.end("ok");
      });
    });

    app.listen(options.port, () => {
      resolve({
        close: () => app.server?.close(),
      });
    });
  });
}
