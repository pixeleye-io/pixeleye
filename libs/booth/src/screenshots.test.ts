import { expect, test, describe, beforeAll } from "vitest";
import { takeScreenshots } from "./screenshots";
import { snapshot } from "@pixeleye/rrweb-snapshot";
import { JSDOM } from "jsdom";
import { chromium, firefox, webkit } from "playwright";
import fs from "fs/promises";
import { generateHash } from "@pixeleye/js-sdk";

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
      fullPage: false,
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

        // These are inconsistent between local machine and ci
        // const hashes = {
        //   "chromium-800x600":
        //     "ecdd9d79c1ca4e512705b5c34c520bd4d7d5909076ac537d88af9ec73c8ae1f3",
        //   "chromium-1024x768":
        //     "ecdd9d79c1ca4e512705b5c34c520bd4d7d5909076ac537d88af9ec73c8ae1f3",
        //   "chromium-100x2000":
        //     "ecdd9d79c1ca4e512705b5c34c520bd4d7d5909076ac537d88af9ec73c8ae1f3",
        //   "firefox-800x600":
        //     "4aeba86f6668abd08c1819422c8f4ec6a2762002a815d7b612394deccb5b53d2",
        //   "firefox-1024x768":
        //     "4aeba86f6668abd08c1819422c8f4ec6a2762002a815d7b612394deccb5b53d2",
        //   "firefox-100x2000":
        //     "4aeba86f6668abd08c1819422c8f4ec6a2762002a815d7b612394deccb5b53d2",
        //   "webkit-800x600":
        //     "04091341124606d1c6b6146994e49db07d91ffdf471e0323bed32d27b641d4c9",
        //   "webkit-1024x768":
        //     "04091341124606d1c6b6146994e49db07d91ffdf471e0323bed32d27b641d4c9",
        //   "webkit-100x2000":
        //     "04091341124606d1c6b6146994e49db07d91ffdf471e0323bed32d27b641d4c9",
        // };

        // const hash = generateHash(snap?.img!);

        // expect(hash).toEqual(
        //   hashes[`${target}-${viewport}` as keyof typeof hashes] as string
        // );
      });
    });
  });
});
