import requireRelative from "require-relative";
import { defaults } from "./defaults";
import { Command, program } from "commander";
import { optionMap } from "../commands";

async function loadConfig(path: string): Promise<Record<string, string>> {
  try {
    let userConfig = requireRelative(
      path || defaults.configFile,
      process.cwd()
    );

    if (typeof userConfig === "function") {
      userConfig = await userConfig();
    }

    if (typeof userConfig !== "object") {
      throw new Error(
        `Config file must export an object or a function that returns an object.`
      );
    }

    if (Object.keys(userConfig).length === 0) {
      console.log("Config is empty.");
    }

    return userConfig;
  } catch (e: any) {
    if (e.code === "MODULE_NOT_FOUND") {
      console.log("No config found.");
    }
  }

  return {};
}

export async function loadAndMergeConfig(
  hookedCommand: Command,
  subCommand: Command
) {
  const commands = hookedCommand.opts();
  const configPath = commands.config;

  const config = await loadConfig(configPath);

  // Merge config file options with command line options
  for (const [key, value] of Object.entries(config)) {
    // Map short options to long options
    const mappedKey = optionMap[key as keyof typeof optionMap] || key;

    // We don't want to override command line options
    const newValue = commands[mappedKey] ?? value;

    subCommand.setOptionValue(mappedKey, newValue);
    commands[mappedKey] = newValue;
  }

  commands.url = commands.url || defaults.endpoint;

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
