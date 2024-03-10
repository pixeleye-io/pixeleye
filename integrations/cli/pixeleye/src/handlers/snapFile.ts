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
import Sitemapper from "sitemapper";

export async function snapFileHandler(
  files: string[],
  options: Config & {
    urls?: string[];
    sitemaps?: string[];
  }
) {
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

  if (options.urls && options.urls.length > 0) {
    const cmdURLs = ora("Parsing urls from command line").start();
    snapshotURLs.push(
      ...options.urls
        .map((url) => ({ url }))
        .filter(
          ({ url }) => !snapshotURLs.some((existing) => existing.url === url)
        )
    );
    cmdURLs.succeed("Successfully parsed urls from command line");
  }

  if (options.sitemaps && options.sitemaps.length > 0) {
    const sitemapURLs = ora("Parsing urls from sitemaps").start();
    const sitemap = new Sitemapper({});

    const urls = await Promise.all(
      options.sitemaps.map(async (sitemapURL) => sitemap.fetch(sitemapURL))
    ).catch((err) => {
      sitemapURLs.fail("Failed to parse urls from sitemaps.");
      program.error(err);
    });

    snapshotURLs.push(
      ...urls.flatMap(({ sites }) =>
        sites
          .map((url) => ({ url }))
          .filter(
            ({ url }) => !snapshotURLs.some((existing) => existing.url === url)
          )
      )
    );

    sitemapURLs.succeed("Successfully parsed urls from sitemaps");
  }

  if (snapshotURLs.length === 0) {
    console.log(errStr("No URLs to snapshot."));
    process.exit(1);
  }

  ora(`Found ${snapshotURLs.length} URLs to snapshot.`).info();

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
    snapshotURLs.map(async (url) =>
      snapshot(
        {
          endpoint: `http://localhost:${options.boothPort}`,
        },
        {
          ...url,
          devices: options.devices!,
          name: url.name || url.url,
          css: `${options.css || ""}\n${url.css || ""}`,
        }
      )
    )
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
