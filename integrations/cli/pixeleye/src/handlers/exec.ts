import ora from "ora";
import { ping } from "@pixeleye/cli-booth";
import { program } from "commander";
import { errStr } from "../messages/ui/theme";
import { exec } from "child_process";
import { API, createBuild } from "@pixeleye/cli-api";
import { Config } from "@pixeleye/cli-config";
import {
  getExitBuild,
  startBooth,
  waitForBuildResult,
  waitForProcessing,
  watchExit,
} from "./utils";
import { execOutput } from "../messages/exec";
import { setEnv } from "@pixeleye/cli-env";

export async function execHandler(
  command: string[],
  options: Config & {
    count?: number;
    shard?: string;
  }
) {
  let buildFinished = false;
  // Lets our integrations know we are running in a Pixeleye environment
  setEnv("PIXELEYE_RUNNING", "true");

  const api = API({
    endpoint: options.endpoint!,
    token: options.token,
  });

  const buildSpinner = ora("Creating build").start();

  const build = await createBuild(api, {
    shardingCount: options.count,
    shardID: options.shard,
  }).catch(async (err) => {
    buildSpinner.fail("Failed to create build.");
    console.log(errStr(err));
    program.error(err);
  });

  buildSpinner.succeed("Successfully created build.");

  const exitBuild = getExitBuild(api, build.id);

  const onExitFns: Array<() => Promise<any>> = [
    async () => {
      if (buildFinished) return;
      console.log(errStr("\nAborting build..."));
      await exitBuild("Interrupted");
    },
  ];

  watchExit(async () => {
    await Promise.all(onExitFns.map((fn) => fn()));
  });

  const fileSpinner = ora("Starting local snapshot server").start();

  const child = await startBooth({
    buildID: build.id,
    token: options.token,
    endpoint: options.endpoint,
    boothPort: options.boothPort,
  });

  onExitFns.push(async () => {
    child.stdin?.end();
    child.stdout?.destroy();
    child.stderr?.destroy();
    child.kill("SIGKILL");
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

  ora(`Running command (${command.join(" ")}) ...`).info();

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
    ora().fail("Failed to run command.");
    await exitBuild(err);
  });

  ora().succeed("Successfully ran command.");

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
    })
    .then(() => {
      completeSpinner.succeed("Successfully completed build.");
      buildFinished = true;
    });

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

  await Promise.all(onExitFns.map((fn) => fn()));

  process.exit(0);
}
