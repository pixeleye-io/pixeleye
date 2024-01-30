import { pixeleyeSnapshot } from "@pixeleye/playwright";
import { test } from "@playwright/test";

test("Landing page screenshot", async ({ page }) => {
  await page.goto("https://syntax.pixeleye.io");

  await page.waitForSelector("kbd.ml-auto"); // This takes a while to load

  await pixeleyeSnapshot(page, { name: "landing" });
});
