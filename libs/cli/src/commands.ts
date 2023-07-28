import chalk from "chalk";
import { Command } from "commander";
import { loadAndMergeConfig } from "./config/config";
import { upload, ping } from "./handlers";
import { defaults } from "./config";

export const program = new Command();

program.configureOutput({
  writeErr: (str) => process.stderr.write(chalk.red(str)),
  writeOut: (str) => process.stdout.write(chalk.green(str)),
});

export const optionMap = {
  t: "token",
  u: "url",
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

export default program.parse(process.argv);
