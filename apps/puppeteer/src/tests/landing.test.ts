import { test, expect, describe, beforeAll, afterAll } from "vitest";
// import "pptr-testing-library/extend"; // we need this to get TS auto-complete
import { type App, start } from "./helpers";
import { pixeleyeSnapshot } from "../snapshot";

describe("Landing page - e2e", () => {
  let app: App;

  beforeAll(async () => {
    app = await start();
  });

  afterAll(async () => {
    await app.stop();
  });

  // In our test, we can use `app.navigate` to navigate to our path
  test("Basic landing page screenshot", async () => {
    await app.navigate("/");

    // eslint-disable-next-line turbo/no-undeclared-env-vars
    process.env.boothPort = app.boothPort.toString();
    await pixeleyeSnapshot(app.page, { name: "landing" });
  });
}, {
  timeout: 5_000,
});
