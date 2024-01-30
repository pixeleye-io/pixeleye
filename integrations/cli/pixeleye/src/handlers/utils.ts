import { APIType } from "@pixeleye/cli-api";
import { program } from "commander";
import ora from "ora";
import { errStr } from "../messages/ui/theme";
import { execFile } from "node:child_process";
import { finished, ping } from "@pixeleye/cli-booth";
import { Build } from "@pixeleye/api";
import EventSource from "eventsource";

export const getExitBuild =
  (api: APIType, buildID: string) => async (err: any) => {
    console.log(errStr(err));

    const abortingSpinner = ora({
      text: "Aborting build...",
      color: "yellow",
    }).start();

    await api
      .post("/v1/client/builds/{id}/abort", {
        params: {
          id: buildID,
        },
      })
      .catch((err) => {
        abortingSpinner.fail("Failed to abort build.");
        console.log(errStr(err));
        program.error(err);
      })
      .then(() => {
        abortingSpinner.succeed("Successfully aborted build.");
      });

    program.error(err);
  };

export function watchExit(callback: () => Promise<void>) {
  process.on("SIGINT", async () => {
    await callback();
  }); // CTRL+C
  process.on("SIGQUIT", async () => {
    await callback();
  }); // Keyboard quit signal
  process.on("SIGTERM", async () => {
    await callback();
  }); // `kill` command
}

export const startBooth = ({
  buildID,
  token,
  endpoint,
  boothPort,
}: {
  buildID: string;
  token: string;
  endpoint?: string;
  boothPort?: string;
}) =>
  execFile(
    "node",
    [
      "booth.js",
      "start",
      `"${buildID}"`,
      `"${token}"`,
      endpoint ? `-e ${endpoint}` : "",
      boothPort ? `-p ${boothPort}` : "",
    ],
    {
      cwd: __dirname,
    },
    (error, stdout, _) => {
      if (error) {
        throw error;
      }
      console.log(stdout);
    }
  );

export const waitForProcessing = async ({
  boothPort,
}: {
  boothPort: string;
}) => {
  const maxRetries = 3;
  // We wait just to make sure the booth server has time to ingest the snapshots
  for (let i = 0; i < maxRetries; i++) {
    await new Promise((r) => setTimeout(r, 1000));

    const res = await finished({
      endpoint: `http://localhost:${boothPort}`,
    }).catch(async (err) => {
      // Lets attempt to ping the booth server to see if it's still running
      await ping({
        endpoint: `http://localhost:${boothPort}`,
      }).catch(async () => {
        // We want to throw the original error, not the ping error
        throw err;
      });
      return { status: 500 };
    });

    if (res.status === 200) return;
  }
  throw new Error("Failed to upload snapshots.");
};

export function splitIntoChunks<T>(array: T[], chunkSize: number): T[][] {
  return array.flatMap((_, i) =>
    i % chunkSize === 0 ? [array.slice(i, i + chunkSize)] : []
  );
}

export async function waitForBuildResult(
  token: string,
  build: Build,
  endpoint?: string
): Promise<Build["status"]> {
  return new Promise<Build["status"]>((resolve, reject) => {
    console.log(
      `${endpoint || "https://api.pixeleye.io"}/v1/client/builds/${build.id}/events`
    );
    const es = new EventSource(
      `${endpoint || "https://api.pixeleye.io"}/v1/client/builds/${build.id}/events`,
      {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      }
    );

    es.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "build_status") {
        const newStatus = data.data.status;

        if (
          [
            "processing",
            "queued-processing",
            "uploading",
            "queued-uploading",
          ].includes(newStatus)
        ) {
          return;
        }

        resolve(newStatus);
      }
    });

    es.onerror = (err) => {
      reject(err);
    };
  });
}
