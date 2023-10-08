import requireRelative from "require-relative";
import { defaults } from "./defaults";

export async function loadConfig(path?: string): Promise<typeof defaults> {
  try {
    let userConfig = requireRelative(path || defaults.config, process.cwd());

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

    return { ...defaults, ...userConfig };
  } catch (e: any) {
    if (e.code === "MODULE_NOT_FOUND") {
      console.log("No config found.");
    } else {
      throw e;
    }
  }

  return defaults;
}
