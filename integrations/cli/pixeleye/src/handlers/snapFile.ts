import ora from "ora";
import { ping, snapshot } from "@pixeleye/cli-booth";
import { program } from "commander";
import { errStr } from "../messages/ui/theme";
import { API, createBuild } from "@pixeleye/cli-api";
import { Config, readSnapshotFiles } from "@pixeleye/cli-config";
import {
  getExitBuild,
  startBooth,
  waitForBuildResult,
  waitForProcessing,
  watchExit,
} from "./utils";

export async function snapFileHandler(files: string[], options: Config) {
  const api = API({
    endpoint: options.endpoint!,
    token: options.token,
  });

  const readFilesSpinner = ora("Reading url files").start();
  // We've already called and resolved urlCaptureFiles if it's a function
  const snapshotURLs = await readSnapshotFiles([
    ...files,
    ...((options.snapshotFiles as string[]) || []),
  ]).catch((err) => {
    readFilesSpinner.fail("Failed to read url files.");
    program.error(err);
  });

  readFilesSpinner.succeed("Successfully read url files.");

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

  const captureURlSpinner = ora("Capturing URLs").start();

  await Promise.all(
    snapshotURLs.map(async (url) => {
      const res = await snapshot(
        {
          endpoint: options.endpoint!,
        },
        {
          devices: options.devices!,
          name: url.name || url.url,
          variant: url.variant,
          url: url.url,
          selector: url.selector,
          maskSelectors: url.maskSelectors,
          css: `${options.css || ""}\n${url.css || ""}`,
          fullPage: url.fullPage,
          waitForSelector: url.waitForSelector,
        }
      );

      return res;
    })
  ).catch(async (err) => {
    captureURlSpinner.fail("Failed to capture URLs.");
    await exitBuild(err);
  });

  captureURlSpinner.succeed("Successfully captured URLs.");

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
