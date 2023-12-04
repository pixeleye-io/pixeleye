import {
  Context,
  createBuild,
  getAPI,
  completeBuild,
  abortBuild,
} from "@pixeleye/js-sdk";
import ora from "ora";
import { ping, start } from "@pixeleye/booth";
import { program } from "commander";
import { noParentBuildFound } from "../messages/builds";
import { execSync, exec } from "child_process";
import { promisify } from "util";
import { captureStories } from "@pixeleye/storybook";

const execAsync = promisify(exec);

interface Config {
  token: string;
  endpoint: string;
  port: number;
  storybookURL: string;
}

export async function e2e(command: string[], options: Config) {
  const ctx: Context = {
    env: process.env,
    endpoint: options.endpoint,
    token: options.token,
  };

  const exitBuild = async (err: any) => {
    await abortBuild(ctx, build);
    console.log(err);
    program.error(err);
  };

  getAPI(ctx);

  // set boothPort env variable for booth server
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  process.env.boothPort = options.port.toString();

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

  const fileSpinner = ora("Starting local snapshot server").start();

  const server = await start({
    port: options.port,
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
    endpoint: `http://localhost:${options.port}`,
  }).catch((err) => {
    pingSpinner.fail("Failed to ping booth server.");
    exitBuild(err);
  });

  pingSpinner.succeed("Successfully pinged booth server.");

  const e2eSpinner = ora(`Starting e2e tests (${command.join(" ")}) ...`)
    .start()
    .succeed();

  await captureStories({
    endpoint: options.endpoint,
    port: options.port,
    storybookURL: options.storybookURL,
    token: options.token,
  }).catch((err) => {
    e2eSpinner.fail("Failed to capture stories.");
    exitBuild(err);
  });

  e2eSpinner.succeed("Successfully captured stories.");

  const completeSpinner = ora("Completing build...").start();

  await completeBuild(ctx, build).catch((err) => {
    completeSpinner.fail("Failed to complete build.");
    exitBuild(err);
  });

  completeSpinner.succeed("Successfully completed build.");

  server?.close();

  process.exit(0);
}
