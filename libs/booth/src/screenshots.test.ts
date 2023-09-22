import { expect, test, describe, beforeAll } from "vitest";
import { takeScreenshots } from "./screenshots";
import { snapshot } from "@chromaui/rrweb-snapshot";
import { JSDOM } from "jsdom";
import { chromium, firefox, webkit } from "playwright";
import fs from "fs/promises";

// TODO - host test website so we can test static urls

function generateData(body: string) {
  const doc = new JSDOM(`<!DOCTYPE html><html><body>${body}</body></html>`, {})
    .window.document;

  return snapshot(doc, {})!;
}

describe("screenshots", () => {
  let browsers = {};

  beforeAll(async () => {
    browsers = await Promise.all([
      chromium.launch(),
      firefox.launch(),
      webkit.launch(),
    ]).then(([chromium, firefox, webkit]) => ({
      chromium,
      firefox,
      webkit,
    }));
  });

  test("take screenshot of hello world", async () => {
    const targets = ["chromium", "firefox", "webkit"];
    const viewports = ["800x600", "1024x768", "100x2000"];

    const snaps = await takeScreenshots(browsers, {
      name: "hello world",
      variant: "default",
      targets,
      viewports,
      fullPage: true,
      dom: generateData(`<body><div>Hello World</div>`),
    });

    targets.forEach((target) => {
      viewports.forEach(async (viewport) => {
        const snap = snaps.find(
          (snap) => snap.target === target && snap.viewport === viewport
        );

        expect(snap).toBeDefined();

        expect(snap?.name).toEqual("hello world");
        expect(snap?.variant).toEqual("default");

        const buffer = await fs.readFile(
          `src/test-images/hello-world-${target}-${viewport}.png`,
          {
            encoding: "base64",
          }
        );

        expect(snap?.img).toEqual(buffer);
      });
    });
  });
});
