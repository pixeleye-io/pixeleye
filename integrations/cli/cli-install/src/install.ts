import {
  installBrowsersForNpmInstall,
  registry,
  // @ts-ignore
} from "playwright-core/lib/server"; // TODO - create some type definitions for this

export async function installBrowsers() {
  await registry.installDeps(registry.defaultExecutables());
  await installBrowsersForNpmInstall(["chromium", "firefox", "webkit"]);
}
