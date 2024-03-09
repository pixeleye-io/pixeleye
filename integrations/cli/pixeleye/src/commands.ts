import chalk from "chalk";
import { Command } from "commander";
import { loadAndMergeConfig } from "./config-loader";
import {
  execHandler,
  ping,
  snapFileHandler,
  storybook,
  uploadHandler,
} from "./handlers";
import { setLogLevel } from "@pixeleye/cli-logger";

export const program = new Command();

program.configureOutput({
  writeErr: (str) => process.stderr.write(chalk.red(str)),
  writeOut: (str) => process.stdout.write(chalk.green(str)),
});

export const optionMap = {
  t: "token",
  e: "endpoint",
  p: "boothPort",
  w: "wait",
  v: "verbose",
  c: "config",
} as const;

const configOption = (name: string) =>
  program
    .command(name)
    .option(
      "-c, --config [path]",
      "Path to config file, e.g. ./config/pixeleye.config.js"
    );

const verboseOption = (name: string) =>
  configOption(name)
    .option("-v, --verbose", "Verbose output")
    .hook("preAction", (hookedCommand) => {
      const commands = hookedCommand.opts();
      if (commands.verbose || commands.v) setLogLevel("verbose");
    });

const apiOptions = (name: string) =>
  verboseOption(name)
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
  .option(
    "-w, --wait [wait]",
    "Wait for build results, outputting them once finished processing",
    "false"
  )
  .description("Run storybook and upload screenshots to pixeleye")
  .hook("preAction", loadAndMergeConfig)
  .action(storybook);

apiOptions("exec")
  .argument("[command...]", "Command to execute")
  .option(
    "-w, --wait [wait]",
    "Wait for build results, outputting them once finished processing",
    "false"
  )
  .option("--count [count]", "Number of shards to split the build into")
  .option(
    "--shard [shard]",
    "An identifier for the shard, use something unique like the CI job id. We'll attempt to set this automatically"
  )
  .description("Start your e2e tests with pixeleye running in the background")
  .hook("preAction", loadAndMergeConfig)
  .action(execHandler);

apiOptions("upload")
  .argument("<dir?", "Directory to upload")
  .option(
    "-w, --wait [wait]",
    "Wait for build results, outputting them once finished processing",
    "false"
  )
  .description("Upload screenshots to pixeleye")
  .hook("preAction", loadAndMergeConfig)
  .action(uploadHandler);

apiOptions("snapshot")
  .argument(
    "[files...]",
    "File globs for pixeleye snapshot definitions. You can also declare these in your config file"
  )
  .option(
    "-w, --wait [wait]",
    "Wait for build results, outputting them once finished processing",
    "false"
  )
  .description(
    "Upload screenshots to pixeleye from a list of URL files passed in or defined in your config file"
  )
  .hook("preAction", loadAndMergeConfig)
  .action(snapFileHandler);

export default program.parse(process.argv);
