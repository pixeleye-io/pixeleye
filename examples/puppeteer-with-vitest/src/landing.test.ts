import { test, expect, describe, beforeAll, afterAll } from "vitest";
import { App, start } from "./helpers";
import { pixeleyeSnapshot } from "@pixeleye/puppeteer";

describe(
  "Landing page - e2e",
  () => {
    let app: App;

    beforeAll(async () => {
      app = await start();
    });

    afterAll(async () => {
      await app.stop();
    });

    test("Landing page screenshot", async () => {
      await app.navigate("/");

      await app.page.waitForNetworkIdle();

      await app.page.waitForSelector("kbd.ml-auto"); // This takes a while to load

      await pixeleyeSnapshot(app.page, { name: "landing" });
    });

    test("Landing page header screenshot", async () => {
      await app.navigate("/");


      await app.page.waitForSelector("kbd.ml-auto"); // This takes a while to load

      await pixeleyeSnapshot(app.page, {
        name: "landing-header",
        selector: "header.sticky",
      });
    });
  },
  {
    timeout: 60_000,
  }
);
