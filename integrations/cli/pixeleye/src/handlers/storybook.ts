import ora from "ora";
import { ping } from "@pixeleye/cli-booth";
import { program } from "commander";
import { captureStories } from "@pixeleye/storybook";
import { errStr } from "../messages/ui/theme";
import { API, createBuild } from "@pixeleye/cli-api";
import { Config } from "@pixeleye/cli-config";
import {
  getExitBuild,
  startBooth,
  waitForBuildResult,
  waitForProcessing,
  watchExit,
} from "./utils";
import { setEnv } from "@pixeleye/cli-env";

export async function storybook(url: string, options: Config) {
  // Lets our integrations know we are running in a Pixeleye environment
  setEnv("PIXELEYE_RUNNING", "true");

  const api = API({
    endpoint: options.endpoint!,
    token: options.token,
  });

  const buildSpinner = ora("Creating build").start();

  const build = await createBuild(api).catch(async (err) => {
    buildSpinner.fail("Failed to create build.");
    console.log(errStr(err));
    program.error(err);
  });

  buildSpinner.succeed("Successfully created build.");

  const exitBuild = getExitBuild(api, build.id);

  watchExit(async () => {
    console.log(errStr("\nAborting build..."));
    await exitBuild("Interrupted");
  });

  const fileSpinner = ora("Starting local snapshot server").start();

  const child = await startBooth({
    buildID: build.id,
    token: options.token,
    endpoint: options.endpoint,
    boothPort: options.boothPort,
  });

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

  let totalSnaps = 0;
  await captureStories({
    storybookURL: url,
    devices: options.devices!,
    variants: options.storybookOptions?.variants,
    callback({ current }) {
      totalSnaps = current;
      storybookSpinner.text = `Capturing stories at ${url}, Snapshots captured: ${current}`;
      return Promise.resolve();
    },
  }).catch(async (err) => {
    storybookSpinner.fail("Failed to capture stories.");
    await exitBuild(err);
  });

  storybookSpinner.succeed(
    `Successfully captured stories (${totalSnaps} snaps in total)`
  );

  const processingSpinner = ora(
    "Waiting for device capturing and uploads to finish"
  ).start();

  await waitForProcessing({
    boothPort: options.boothPort!,
  }).catch(async (err) => {
    processingSpinner.fail("Device capturing and uploads failed.");
    await exitBuild(err);
  });

  processingSpinner.succeed(
    "Successfully processed device capturing and uploads."
  );

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

  if (options.waitForStatus) {
    const waitForStatus = ora("Waiting for build to finish processing").start();

    const finalStatus = await waitForBuildResult(
      options.token,
      build,
      options.endpoint
    ).catch(async () => {
      waitForStatus.fail("Failed to wait for build to finish processing.");
      await process.exit(1);
    });

    waitForStatus.succeed("Successfully finished processing build.");

    console.log(`\nBuild status: ${finalStatus}`);
  }

  child.kill();

  process.exit(0);
}
