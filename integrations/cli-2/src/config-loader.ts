import { Command, program } from "commander";
import { optionMap } from "./commands";
import { loadConfig, defaults } from "@pixeleye/js-sdk";

export async function loadAndMergeConfig(
  hookedCommand: Command,
  subCommand: Command
) {
  const commands = hookedCommand.opts();
  const configPath = commands.config;

  // eslint-disable-next-line turbo/no-undeclared-env-vars
  process.env.PIXELEYE_CONFIG_PATH = configPath;

  const config = await loadConfig(configPath);

  // Merge config file options with command line options
  for (const [key, value] of Object.entries(config)) {
    // Map short options to long options
    const mappedKey = optionMap[key as keyof typeof optionMap] || key;

    const defaultValue = defaults[mappedKey as keyof typeof defaults];

    // We don't want to override command line options
    const newValue = commands[mappedKey] ?? value ?? defaultValue;

    subCommand.setOptionValue(mappedKey, newValue);
    commands[mappedKey] = newValue;
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
}
