import {
  installBrowsersForNpmInstall,
  registry,
  // @ts-ignore
} from "playwright-core/lib/server";

export async function installBrowsers() {
  await registry.installDeps(registry.defaultExecutables());
  await installBrowsersForNpmInstall(["chromium", "firefox", "webkit"]);
}
