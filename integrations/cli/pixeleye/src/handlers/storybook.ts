import ora from "ora";
import { finished, ping } from "@pixeleye/cli-booth";
import { program } from "commander";
import { noParentBuildFound } from "../messages/builds";
import { captureStories } from "@pixeleye/storybook";
import { errStr } from "../messages/ui/theme";
import { execFile } from "child_process";
import { API, APIType, createBuild } from "@pixeleye/cli-api";
import { Config } from "@pixeleye/cli-config";

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

export async function storybook(url: string, options: Config) {
  const api = API({
    endpoint: options.endpoint!,
    token: options.token,
  });

  // set boothPort env variable for booth server
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  process.env.PIXELEYE_BOOTH_PORT = options.boothPort;

  const buildSpinner = ora("Creating build").start();

  const build = await createBuild(api).catch(async (err) => {
    buildSpinner.fail("Failed to create build.");
    console.log(errStr(err));
    program.error(err);
  });

  if (!build.parentBuildIDs) {
    noParentBuildFound();
  }

  buildSpinner.succeed("Successfully created build.");

  const exitBuild = getExitBuild(api, build.id);

  watchExit(async () => {
    console.log(errStr("\nAborting build..."));
    await exitBuild("Interrupted");
  });

  const fileSpinner = ora("Starting local snapshot server").start();

  const child = execFile(
    "node",
    [
      "booth.js",
      "start",
      `"${build.id}"`,
      `"${options.token}"`,
      options.endpoint ? `-e ${options.endpoint}` : "",
      options.boothPort ? `-p ${options.boothPort}` : "",
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

  fileSpinner.succeed("Successfully started local snapshot server.");

  const pingSpinner = ora("Pinging booth server").start();

  await ping({
    endpoint: `http://localhost:${options.boothPort}`,
  }).catch(async (err) => {
    pingSpinner.fail("Failed to ping booth server.");
    await exitBuild(err);
  });

  pingSpinner.succeed("Successfully pinged booth server.");

  const storybookSpinner = ora(
    `Capturing stories at ${url}, Snapshots captured: 0`
  ).start();

  await captureStories({
    storybookURL: url,
    devices: options.devices!,
    variants: options.storybookOptions?.variants,
    callback({ current }) {
      storybookSpinner.text = `Capturing stories at ${url}, Snapshots captured: ${current}`;
      return Promise.resolve();
    },
  }).catch(async (err) => {
    storybookSpinner.fail("Failed to capture stories.");
    await exitBuild(err);
  });

  storybookSpinner.succeed("Successfully captured stories.");

  const processingSpinner = ora(
    "Waiting for snapshots to finish uploading"
  ).start();

  let processing = true;
  // We wait just to make sure the booth server has time to ingest the snapshots
  while (processing) {
    await new Promise((r) => setTimeout(r, 1000));

    await finished({
      endpoint: `http://localhost:${options.boothPort}`,
    })
      .then((res) => {
        if (res.status === 200) processing = false;
      })
      .catch(async () => {
        // May have timed out so we should first ping the server to see if it's still alive
        await ping({
          endpoint: `http://localhost:${options.boothPort}`,
        }).catch(async (err) => {
          processingSpinner.fail("Failed to ping booth server.");
          await exitBuild(err);
        });
      });
  }

  processingSpinner.succeed("Successfully uploaded snapshots.");

  const completeSpinner = ora("Completing build...").start();

  await api
    .post("/v1/client/builds/{id}/complete", {
      params: {
        id: build.id,
      },
    })
    .catch(async (err) => {
      completeSpinner.fail("Failed to complete build.");
      await exitBuild(err);
    });

  completeSpinner.succeed("Successfully completed build.");

  child.kill();

  process.exit(0);
}
