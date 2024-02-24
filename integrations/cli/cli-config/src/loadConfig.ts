import { defaultConfig } from "./defaults";
import { setEnv } from "@pixeleye/cli-env";
import jitiFactory from "jiti";
import { transform } from "sucrase";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { Config } from "./types";

let jiti: ReturnType<typeof jitiFactory> | null = null;

function isObject(item: unknown): item is Record<string, unknown> {
  return Boolean(item) && typeof item === "object" && !Array.isArray(item);
}

function mergeObjects<T extends Record<string, unknown>>(
  defaultConfig: T,
  userConfig: T
): T {
  const mergedConfig = {
    ...defaultConfig,
    ...userConfig,
  };

  for (const key of Object.keys(mergedConfig) as Array<keyof T>) {
    if (isObject(defaultConfig[key]) && isObject(userConfig[key])) {
      mergedConfig[key] = mergeObjects(
        defaultConfig[key] as Record<string, unknown>,
        userConfig[key] as Record<string, unknown>
      ) as T[keyof T];
    }
  }

  return mergedConfig;
}

function lazyJiti() {
  return (
    jiti ??
    (jiti = jitiFactory(__filename, {
      interopDefault: true,
      transform: (opts) => {
        return transform(opts.source, {
          transforms: ["typescript", "imports"],
        });
      },
    }))
  );
}

function readConfig(path: string): Config | (() => Promise<Config>) {
  let config = (function () {
    try {
      return path ? require(path) : {};
    } catch {
      return lazyJiti()(path);
    }
  })();

  return config.default ?? config;
}

const toUpperCamelCase = (str: string) =>
  str.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase();

export async function loadConfig(path?: string): Promise<Config> {
  if (!path) {
    const endings = ["ts", "js", "cjs", "mjs"];
    const fileName = "pixeleye.config";

    for (const ending of endings) {
      if (existsSync(join(process.cwd(), `${fileName}.${ending}`))) {
        path = `${fileName}.${ending}`;
        break;
      }
    }
  }

  if (!path) {
    console.warn("No config file found.");
    return defaultConfig as Config;
  }

  const relativePath = join(process.cwd(), path ?? "");

  let userConfig = readConfig(relativePath);

  if (typeof userConfig === "function") {
    userConfig = await userConfig().catch((err) => {
      throw new Error(`Failed to load config file: ${err.message}`);
    });
  }

  if (typeof userConfig !== "object") {
    throw new Error(
      `Config file must export an object or a function that returns an object.`
    );
  }

  if (Object.keys(userConfig).length === 0) {
    console.log("Config is empty.");
  }

  const merged = mergeObjects(defaultConfig as Config, userConfig);

  for (const key of Object.keys(merged) as Array<keyof Config>) {
    // IF string then set env variable
    if (typeof merged[key] === "string") {
      setEnv(`PIXELEYE_${toUpperCamelCase(key)}`, merged[key] as string);
    } else {
      // ELSE stringify and set env variable
      setEnv(`PIXELEYE_${toUpperCamelCase(key)}`, JSON.stringify(merged[key]));
    }
  }

  return merged;
}
