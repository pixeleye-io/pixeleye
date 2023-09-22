import { Context, createBuild, getAPI, completeBuild } from "@pixeleye/js-sdk";
import ora from "ora";
import { start } from "@pixeleye/booth";
import { program } from "commander";
import { noParentBuildFound } from "../messages/builds";
import { execSync } from "child_process";

interface Config {
  token: string;
  url: string;
  port: number;
}

export async function e2e(command: string, options: Config) {
  const ctx: Context = {
    env: process.env,
    endpoint: options.url,
    token: options.token,
  };

  getAPI(ctx);

  const buildSpinner = ora("Creating build").start();

  const build = await createBuild(ctx).catch((err) => {
    buildSpinner.fail("Failed to create build.");
    program.error(err);
  });

  if (!build.parentBuildIDs) {
    noParentBuildFound();
  }

  buildSpinner.succeed("Successfully created build.");

  const fileSpinner = ora("Starting local snapshot server").start();

  await start({
    port: options.port,
    endpoint: options.url,
    token: options.token,
    build,
  }).catch((err) => {
    fileSpinner.fail("Failed to start local snapshot server.");
    program.error(err);
  });

  fileSpinner.succeed("Successfully started local snapshot server.");

  const e2eSpinner = ora("Starting e2e tests ...").start();

  try {
    execSync(command, {
      stdio: "inherit",
    });
  } catch (err) {
    e2eSpinner.fail("Failed to run e2e tests.");
    program.error(err as any);
  }

  e2eSpinner.succeed("Successfully ran e2e tests.");

  const completeSpinner = ora("Completing build...").start();

  await completeBuild(ctx, build).catch((err) => {
    completeSpinner.fail("Failed to complete build.");
    program.error(err?.toString() || err);
  });

  completeSpinner.succeed("Successfully completed build.");
}
