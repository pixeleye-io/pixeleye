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
import { exec } from "node:child_process";
import { execOutput } from "../messages/exec";
import { getExitBuild } from "./storybook";
import { errStr } from "../messages/ui/theme";

interface Config {
  token: string;
  endpoint: string;
  boothPort: number;
}

export async function e2e(command: string[], options: Config) {
  const ctx: Context = {
    env: process.env,
    endpoint: options.endpoint,
    token: options.token,
  };

  getAPI(ctx);

  // set boothPort env variable for booth server
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  process.env.boothPort = options.boothPort.toString();

  const buildSpinner = ora("Creating build").start();

  const build = await createBuild(ctx).catch((err) => {
    buildSpinner.fail("Failed to create build.");
    console.log(err);
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
    port: options.boothPort,
    endpoint: options.endpoint,
    token: options.token,
    build,
  }).catch((err) => {
    fileSpinner.fail("Failed to start local snapshot server.");
    exitBuild(err);
  });

  fileSpinner.succeed("Successfully started local snapshot server.");

  const pingSpinner = ora("Pinging booth server").start();

  await ping({
    endpoint: `http://localhost:${options.boothPort}`,
  }).catch((err) => {
    pingSpinner.fail("Failed to ping booth server.");
    exitBuild(err);
  });

  pingSpinner.succeed("Successfully pinged booth server.");

  const e2eSpinner = ora(`Starting e2e tests (${command.join(" ")}) ...`)
    .start()
    .succeed();

  const promise = () =>
    new Promise((resolve, reject) => {
      const child = exec(command.join(" "), {
        cwd: process.cwd(),
      });

      child.on("error", (err) => {
        console.log(err);
        reject(err);
      });

      child.on("exit", (code) => {
        if (code === 0) {
          resolve(undefined);
        } else {
          reject();
        }
      });

      child.stdout?.on("data", (data) => {
        console.log(execOutput(data.toString()));
      });
    });

  await promise().catch(async (err) => {
    e2eSpinner.fail("Failed to run e2e tests.");
    await exitBuild(err);
  });

  e2eSpinner.succeed("Successfully ran e2e tests.");

  const processingSpinner = ora(
    "Waiting for booth server to process..."
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

  const completeSpinner = ora("Completing build...").start();

  await completeBuild(ctx, build).catch((err) => {
    completeSpinner.fail("Failed to complete build.");
    exitBuild(err);
  });

  completeSpinner.succeed("Successfully completed build.");

  server?.close();

  process.exit(0);
}
