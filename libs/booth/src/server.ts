import polka from "polka";
import { pingHandler, snapshotHandler } from "./handlers";
import { json } from "body-parser";
import { finishedHandler } from "./handlers/finishedHandler";
import { Build } from "@pixeleye/api";

export interface BoothServerOptions {
  port: number;
  endpoint: string;
  token: string;
  buildID: Build["id"];
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

    app.get("/ping", pingHandler);

    app.post("/snapshot", snapshotHandler(options));

    app.get("/finished", finishedHandler);

    app.listen(options.port, () => {
      resolve({
        close: () => app.server?.close(),
      });
    });
  });
}
