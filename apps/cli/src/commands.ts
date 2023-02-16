import chalk from "chalk";
import { Command } from "commander";
import { readConfig } from "./config";
import upload from "./upload";

const program = new Command();

program;

program
  .command("upload")
  .argument("<path>", "Path to screenshots, e.g. ./screenshots")
  .option(
    "-c, --config <path>",
    "Path to config file, e.g. ./config/pixeleye.config.js",
    "pixeleye.config.js",
  )
  .option("-k, --key <key>", "Pixeleye API key")
  .option("-s, --secret <secret>", "Pixeleye API secret")
  .description("Upload your screenshots to pixeleye")
  .hook("preAction", async (hookedCommand, subCommand) => {
    const commands = hookedCommand.opts();
    const configPath = commands.config;

    const config = configPath ? await readConfig(configPath) : {};
    for (const [key, value] of Object.entries(config)) {
      subCommand.setOptionValue(key, value);
      commands[key] = value;
    }

    // Key and secret are required
    if (!(commands.key || commands.k) || !(commands.secret || commands.s))
      program.error(
        "Pixeleye API key and secret are required. Please provide them via the command line or a config file.",
        {
          exitCode: 9,
          code: "PIXELEYE_KEY_SECRET_REQUIRED",
        },
      );
  })
  .action(upload)
  .configureOutput({
    outputError: (str, write) => write(chalk.red(str)),
  });

export default program.parse(process.argv);
