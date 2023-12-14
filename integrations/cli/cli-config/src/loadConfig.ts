import { defaultConfig } from "./defaults";
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

export async function loadConfig(path?: string): Promise<Config> {
  if (!path) {
    // We store the path in an env variable so that we can access the config via other integrations. E.g Puppeteer.
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    path = process.env.PIXELEYE_CONFIG_PATH;
  }

  if (!path) {
    const endings = ["ts", "js", "cjs", "mjs"];
    path = "pixeleye.config";

    for (const ending of endings) {
      if (existsSync(join(process.cwd(), `${path}.${ending}`))) {
        path = `${path}.${ending}`;
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

  return mergeObjects(defaultConfig as Config, userConfig);
}