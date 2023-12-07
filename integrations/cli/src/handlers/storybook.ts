import {
  Context,
  createBuild,
  getAPI,
  completeBuild,
  abortBuild,
} from "@pixeleye/js-sdk";
import ora from "ora";
import { finished, ping, start } from "@pixeleye/booth";
import { program } from "commander";
import { noParentBuildFound } from "../messages/builds";
import { captureStories } from "@pixeleye/storybook";
import { errStr } from "../messages/ui/theme";

interface Config {
  token: string;
  endpoint: string;
  port: number;
}

export const getExitBuild = (ctx: Context, build: any) => async (err: any) => {
  console.log(errStr(err));

  const abortingSpinner = ora({
    text: "Aborting build...",
    color: "yellow",
  }).start();

  await abortBuild(ctx, build)
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

export async function storybook(url: string, options: Config) {
  const ctx: Context = {
    env: process.env,
    endpoint: options.endpoint,
    token: options.token,
  };

  getAPI(ctx);

  // set boothPort env variable for booth server
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  process.env.boothPort = options.port.toString();

  const buildSpinner = ora("Creating build").start();

  const build = await createBuild(ctx).catch(async (err) => {
    buildSpinner.fail("Failed to create build.");
    console.log(errStr(err));
    program.error(err);
  });

  if (!build.parentBuildIDs) {
    noParentBuildFound();
  }

  buildSpinner.succeed("Successfully created build.");

  const exitBuild = getExitBuild(ctx, build);

  const abortDetected = async () => {
    console.log(errStr("\nAborting build..."));
    await exitBuild("Interrupted");
  };

  process.on("SIGINT", async () => {
    await abortDetected();
  }); // CTRL+C
  process.on("SIGQUIT", async () => {
    await abortDetected();
  }); // Keyboard quit signal
  process.on("SIGTERM", async () => {
    await abortDetected();
  }); // `kill` command

  const fileSpinner = ora("Starting local snapshot server").start();

  const server = await start({
    port: options.port,
    endpoint: options.endpoint,
    token: options.token,
    build,
  }).catch(async (err) => {
    fileSpinner.fail("Failed to start local snapshot server.");
    await exitBuild(err);
  });

  fileSpinner.succeed("Successfully started local snapshot server.");

  const pingSpinner = ora("Pinging booth server").start();

  await ping({
    endpoint: `http://localhost:${options.port}`,
  }).catch(async (err) => {
    pingSpinner.fail("Failed to ping booth server.");
    await exitBuild(err);
  });

  pingSpinner.succeed("Successfully pinged booth server.");

  const storybookSpinner = ora(`Capturing stories at ${url}`).start();

  await captureStories({
    endpoint: options.endpoint,
    port: options.port,
    storybookURL: url,
    token: options.token,
  }).catch(async (err) => {
    storybookSpinner.fail("Failed to capture stories.");
    await exitBuild(err);
  });

  storybookSpinner.succeed("Successfully captured stories.");

  const processingSpinner = ora(
    "Waiting for snapshots to finish processing"
  ).start();

  let processing = true;
  // We wait just to make sure the booth server has time to ingest the snapshots
  while (processing) {
    await new Promise((r) => setTimeout(r, 1000));

    await finished({
      endpoint: `http://localhost:${options.port}`,
    })
      .then((res) => {
        if (res.status === 200) processing = false;
      })
      .catch(async () => {
        // May have timed out so we should first ping the server to see if it's still alive
        await ping({
          endpoint: `http://localhost:${options.port}`,
        }).catch(async (err) => {
          processingSpinner.fail("Failed to ping booth server.");
          await exitBuild(err);
        });
      });
  }

  processingSpinner.succeed("Successfully processed snapshots.");

  const completeSpinner = ora("Completing build...").start();

  await completeBuild(ctx, build).catch(async (err) => {
    completeSpinner.fail("Failed to complete build.");
    await exitBuild(err);
  });

  completeSpinner.succeed("Successfully completed build.");

  server?.close();

  process.exit(0);
}
