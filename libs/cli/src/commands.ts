import chalk from "chalk";
import { Command } from "commander";
import { loadAndMergeConfig } from "./config";
import { upload, ping, e2e, storybook } from "./handlers";
import { defaults } from "@pixeleye/js-sdk";

export const program = new Command();

program.configureOutput({
  writeErr: (str) => process.stderr.write(chalk.red(str)),
  writeOut: (str) => process.stdout.write(chalk.green(str)),
});

export const optionMap = {
  t: "token",
  u: "url",
  p: "port",
} as const;

const configOption = (name: string) =>
  program
    .command(name)
    .option(
      "-c, --config <path>",
      "Path to config file, e.g. ./config/pixeleye.config.js",
      defaults.configFile
    );

const apiOptions = (name: string) =>
  configOption(name)
    .option("-t, --token <token>", "Pixeleye project token", undefined)
    .option(
      "-u, --url <url>",
      "Pixeleye API URL (only use if self-hosting)",
      defaults.endpoint
    );

apiOptions("upload")
  .argument("<path>", "Path to screenshots, e.g. ./screenshots")
  .description("Upload your screenshots to pixeleye")
  .hook("preAction", loadAndMergeConfig)
  .action(upload);

apiOptions("ping")
  .description("Test your token and connection to pixeleye")
  .hook("preAction", loadAndMergeConfig)
  .action(ping);

apiOptions("e2e")
  .option(
    "-p, --port <port>",
    "Port to run local snapshot server",
    defaults.port
  )
  .argument("<command>", "Command to run e2e tests, e.g. cypress run")
  .description("Run e2e tests and upload screenshots to pixeleye")
  .hook("preAction", loadAndMergeConfig)
  .action(e2e);

apiOptions("storybook")
  .option(
    "-p, --port <port>",
    "Port to run local snapshot server",
    defaults.port
  )
  .argument("<url>", "URL to your storybook, e.g. http://localhost:6006")
  .description(
    "Capture your storybook stories and upload screenshots to pixeleye"
  )
  .hook("preAction", loadAndMergeConfig)
  .action(storybook);

export default program.parse(process.argv);
