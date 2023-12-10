import chalk from "chalk";
import { Command } from "commander";
import { loadAndMergeConfig } from "./config-loader";
import { execHandler, ping, storybook, uploadHandler } from "./handlers";

export const program = new Command();

program.configureOutput({
  writeErr: (str) => process.stderr.write(chalk.red(str)),
  writeOut: (str) => process.stdout.write(chalk.green(str)),
});

export const optionMap = {
  t: "token",
  e: "endpoint",
  p: "boothPort",
} as const;

const configOption = (name: string) =>
  program
    .command(name)
    .option(
      "-c, --config [path]",
      "Path to config file, e.g. ./config/pixeleye.config.js"
    );

const apiOptions = (name: string) =>
  configOption(name)
    .option("-t, --token <token>", "Pixeleye project token")
    .option(
      "-e, --endpoint [endpoint]",
      "Pixeleye API endpoint (only use if self-hosting)"
    );

apiOptions("ping")
  .description("Test your connection to pixeleye")
  .hook("preAction", loadAndMergeConfig)
  .action(ping);

apiOptions("storybook")
  .argument(
    "[url]",
    "URL to storybook, can be local or remote",
    "http://localhost:6006"
  )
  .description("Run storybook and upload screenshots to pixeleye")
  .hook("preAction", loadAndMergeConfig)
  .action(storybook);

apiOptions("exec")
  .argument("[command...]", "Command to execute")
  .description("Start your e2e tests with pixeleye running in the background")
  .hook("preAction", loadAndMergeConfig)
  .action(execHandler);

apiOptions("upload")
  .argument("<dir?", "Directory to upload")
  .description("Upload screenshots to pixeleye")
  .hook("preAction", loadAndMergeConfig)
  .action(uploadHandler);

export default program.parse(process.argv);
