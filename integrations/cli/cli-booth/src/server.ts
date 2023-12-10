import polka from "polka";
import { json } from "body-parser";
import { Build } from "@pixeleye/api";
import { DomEnvironment } from "@pixeleye/cli-config";
import { SnapshotRequest, handleQueue, queue } from "./snapshotQueue";

export interface BoothServerOptions {
  port: number;
  endpoint: string;
  token: string;
  buildID: Build["id"];
  domEnvironment: DomEnvironment;
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
