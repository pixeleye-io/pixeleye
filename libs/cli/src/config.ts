import { Command, program } from "commander";
import { optionMap } from "./commands";
import { loadConfig, defaults } from "@pixeleye/js-sdk";

export async function loadAndMergeConfig(
  hookedCommand: Command,
  subCommand: Command
) {
  const commands = hookedCommand.opts();

  const config = await loadConfig(commands.config);

  // Merge config file options with command line options
  for (const [key, value] of Object.entries(config)) {
    // Map short options to long options
    const mappedKey = optionMap[key as keyof typeof optionMap] || key;

    // We don't want to override command line options
    const newValue = commands[mappedKey] || value;

    console.log(mappedKey, newValue);
    subCommand.setOptionValue(mappedKey, newValue);
    commands[mappedKey] = newValue;
  }

  console.log(config, commands);

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
