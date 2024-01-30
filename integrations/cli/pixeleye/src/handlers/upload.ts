import ora from "ora";
import { program } from "commander";
import { noParentBuildFound } from "../messages/builds";
import { errStr } from "../messages/ui/theme";
import { API, createBuild, uploadSnapshots } from "@pixeleye/cli-api";
import { PartialSnapshot } from "@pixeleye/api";
import { Config } from "@pixeleye/cli-config";
import {
  getExitBuild,
  splitIntoChunks,
  waitForBuildResult,
  watchExit,
} from "./utils";
import fsCallback from "graceful-fs";
import { promisify } from "util";
import { join } from "path";
import { dirNotFound, noImagesFound } from "../messages/files";

const fs = {
  readdir: promisify(fsCallback.readdir),
  readFile: promisify(fsCallback.readFile),
};

async function readAllFiles(path: string) {
  const dir = join(process.cwd(), path);

  // read all files in the directory

  return fs
    .readdir(dir, {
      withFileTypes: true,
    })
    .then((files) =>
      files.filter((file) => file.isFile() && file.name.endsWith(".png"))
    );
}

function decode(fileName: string) {
  const decoded = decodeURIComponent(fileName);

  const [name, variant] = decoded
    .split("--")
    .map((str) => str.trim())
    .map((str) => str.replaceAll("\\-", "-"));

  return {
    name: name!,
    variant: variant?.replace(/\.png$/, ""),
  };
}

export async function uploadHandler(dir: string, options: Config) {
  const api = API({
    endpoint: options.endpoint!,
    token: options.token,
  });

  const fileSpinner = ora("Reading files").start();

  const files = await readAllFiles(dir).catch((err) => {
    fileSpinner.fail("Failed to read files.");
    console.log(errStr(err.toString()));
    if (err?.code === "ENOENT") {
      dirNotFound(dir);
      process.exit(9);
    }
    program.error(err);
  });

  if (!files || files.length === 0) {
    fileSpinner.fail("Failed to read files.");
    noImagesFound(dir);
    process.exit(9);
  }

  fileSpinner.succeed("Successfully read files.");

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

  const uploadingSpinner = ora("Uploading files").start();

  const groups = splitIntoChunks(files, 20);

  try {
    for (const files of groups) {
      const readFiles = await Promise.all(
        files.map(async (f) => ({
          file: await fs.readFile(join(process.cwd(), dir, f.name)),
          format: "image/png",
          name: f.name,
        }))
      );

      const uploaded = await uploadSnapshots(
        options.endpoint!,
        options.token,
        readFiles
      );

      await api.post("/v1/client/builds/{id}/upload", {
        params: {
          id: build.id,
        },
        body: {
          snapshots: readFiles.map(
            ({ name, format }, i) =>
              ({
                name: decode(name).name,
                variant: decode(name).variant,
                format,
                snapID: uploaded[i].id,
                target: "unknown device",
              }) as PartialSnapshot
          ),
        },
      });
    }
  } catch (err: any) {
    uploadingSpinner.fail("Failed to upload snapshots to Pixeleye.");
    await exitBuild(err);
  }

  uploadingSpinner.succeed("Successfully uploaded snapshots to Pixeleye.");

  const completeSpinner = ora("Completing build...").start();

  let statusFailed = false;
  // We need to do this before completing to ensure we don't miss any status updates
  const status = waitForBuildResult(
    options.token,
    build,
    options.endpoint
  ).catch(() => {
    statusFailed = true;
  });

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

    await status;

    if (statusFailed) {
      waitForStatus.fail("Failed to wait for build to finish processing.");
      await process.exit(1);
    }

    waitForStatus.succeed("Successfully finished processing build.");

    console.log(`\nBuild status: ${status}`);
  }

  process.exit(0);
}
