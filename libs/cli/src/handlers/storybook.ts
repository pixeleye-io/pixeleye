import { Context, createBuild, getAPI, completeBuild } from "@pixeleye/js-sdk";
import ora from "ora";
import { start } from "@pixeleye/booth";
import { captureStories } from "@pixeleye/storybook";
import { program } from "commander";
import { noParentBuildFound } from "../messages/builds";

interface Config {
  token: string;
  endpoint: string;
  port: number;
}

export async function storybook(storybookURL: string, options: Config) {
  const ctx: Context = {
    env: process.env,
    endpoint: options.endpoint,
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
    endpoint: options.endpoint,
    token: options.token,
    build,
  }).catch((err) => {
    fileSpinner.fail("Failed to start local snapshot server.");
    program.error(err);
  });

  fileSpinner.succeed("Successfully started local snapshot server.");

  const e2eSpinner = ora("Starting storybook crawler...").start();

  try {
    await captureStories({
      storybookURL,
      port: options.port,
      endpoint: options.endpoint,
      token: options.token,
    });
  } catch (err) {
    e2eSpinner.fail("Failed to run storybook crawler.");
    program.error(err as any);
  }

  e2eSpinner.succeed("Successfully captured your stories.");

  const completeSpinner = ora("Completing build...").start();

  await completeBuild(ctx, build).catch((err) => {
    completeSpinner.fail("Failed to complete build.");
    program.error(err?.toString() || err);
  });

  completeSpinner.succeed("Successfully completed build.");
}
