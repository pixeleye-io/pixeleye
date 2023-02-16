import fs from "fs";

interface Config {
  apiKey: string;
  apiSecret: string;
}

export async function readConfig(path: string): Promise<Partial<Config>> {
  if (fs.existsSync(path) && fs.statSync(path).isFile()) {
    const module = await import(path);
    return module.default;
  } else {
    throw new Error(`Config file '${path}' does not exist.`);
  }
}
