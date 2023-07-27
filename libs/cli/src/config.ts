import fs from "fs";

export async function readConfig(path: string): Promise<Partial<any>> {
  if (fs.existsSync(path) && fs.statSync(path).isFile()) {
    const module = await import(path);
    return module.default;
  } else {
    console.log("Config file does not exist.")
    return {};
  }
}
