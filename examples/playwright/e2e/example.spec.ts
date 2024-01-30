// Currently a workaround for this monorepo setup. Please just use
// import { pixeleyeSnapshot } from "@pixeleye/playwright";
// instead of what is below.
// @ts-ignore
import { pixeleyeSnapshot } from "@pixeleye/playwright/dist/index";
import { test, expect } from "@playwright/test";

test("Landing page screenshot", async ({ page }) => {
  await page.goto("https://syntax.pixeleye.io");

  await page.waitForSelector("kbd.ml-auto"); // This takes a while to load

  await pixeleyeSnapshot(page, { name: "landing" });
});
