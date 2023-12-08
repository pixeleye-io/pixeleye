import { Config, defaults } from "./defaults";
import jitiFactory from "jiti";
import { transform } from "sucrase";
import { join, relative } from "path";
import { existsSync } from "fs";

let jiti: ReturnType<typeof jitiFactory> | null = null;

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
  if (path == "") {
    const endings = ["ts", "cjs", "mjs", "js"];
    path = "pixeleye.config";

    for (const ending of endings) {
      if (existsSync(join(process.cwd(), `${path}.${ending}`))) {
        path = `${path}.${ending}`;
        break;
      }
    }
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

  return {
    ...defaults,
    ...userConfig,
    storybookOptions: {
      ...defaults.storybookOptions,
      ...userConfig.storybookOptions,
    },
  };
}
