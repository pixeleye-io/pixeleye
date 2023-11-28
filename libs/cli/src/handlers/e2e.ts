import { Context, createBuild, getAPI, completeBuild } from "@pixeleye/js-sdk";
import ora from "ora";
import { ping, start } from "@pixeleye/booth";
import { program } from "commander";
import { noParentBuildFound } from "../messages/builds";
import { execSync, exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface Config {
  token: string;
  endpoint: string;
  port: number;
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
    console.log(err);
    program.error(err);
  });

  fileSpinner.succeed("Successfully started local snapshot server.");

  const pingSpinner = ora("Pinging booth server").start();

  await ping({
    endpoint: `http://localhost:${options.port}`,
  }).catch((err) => {
    pingSpinner.fail("Failed to ping booth server.");
    console.log(err);
    program.error(err);
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
        console.log(data);
      });

      child.on("message", (message) => {
        console.log(message);
      });
    });

  await promise().catch((err) => {
    e2eSpinner.fail("Failed to run e2e tests.");
    console.log(err);
    program.error(err as any);
  });

  const completeSpinner = ora("Completing build...").start();

  await completeBuild(ctx, build).catch((err) => {
    completeSpinner.fail("Failed to complete build.");
    console.log(err);
    program.error(err?.toString() || err);
  });

  completeSpinner.succeed("Successfully completed build.");

  server.close();

  process.exit(0);
}
