import chalk from "chalk";
import { Command } from "commander";
import { readConfig } from "./config";
import upload from "./upload";

const program = new Command();

const map = {
  t: "token",
  u: "url",
} as const;

program
  .command("upload")
  .argument("<path>", "Path to screenshots, e.g. ./screenshots")
  .option(
    "-c, --config <path>",
    "Path to config file, e.g. ./config/pixeleye.config.js",
    "pixeleye.config.js"
  )
  .option("-t, --token <token>", "Pixeleye project token")
  .option("-u, --url <url>", "Pixeleye API URL (only used for self-hosting)", "https://pixeleye.io")
  .description("Upload your screenshots to pixeleye")
  .hook("preAction", async (hookedCommand, subCommand) => {
    const commands = hookedCommand.opts();
    const configPath = commands.config;

    const config = configPath ? await readConfig(configPath) : {};
    for (const [key, value] of Object.entries(config)) {
      const mappedKey = Object.keys(map).includes(key)
        ? map[key as keyof typeof map]
        : key;
      subCommand.setOptionValue(mappedKey, value);
      commands[mappedKey] = value;
    }

    // Key and secret are required
    if (!commands.token)
      program.error(
        "Pixeleye project token required. Please provide it via the command line or a config file.",
        {
          exitCode: 9,
          code: "PIXELEYE_TOKEN_REQUIRED",
        }
      );
  })
  .action(upload)
  .configureOutput({
    outputError: (str, write) => write(chalk.red(str)),
  });

export default program.parse(process.argv);
