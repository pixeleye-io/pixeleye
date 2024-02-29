import { pixeleyeSnapshot } from "@pixeleye/playwright";
import { SBWindow } from "./browser";
import { chromium } from "playwright-core";
import { DeviceDescriptor } from "@pixeleye/cli-devices";

async function openBrowser() {
  const browser = await chromium.launch({
    headless: true,
  });
  const page = await browser.newPage();
  return { browser, page };
}

export async function captureStories({
  storybookURL,
  variants,
  callback,
  devices,
}: {
  storybookURL: string;
  devices: DeviceDescriptor[];
  variants?: { name: string; params?: string }[];
  callback?: ({ current }: { current: number }) => Promise<void>;
}) {
  const { browser, page } = await openBrowser();

  await page.goto(storybookURL);

  await page.goto(
    storybookURL +
      "/iframe.html?selectedKind=story-crawler-kind&selectedStory=story-crawler-story",
    {
      timeout: 60_000,
      waitUntil: "domcontentloaded",
    }
  );

  await page.waitForFunction(
    () => (window as SBWindow).__STORYBOOK_CLIENT_API__,
    {
      timeout: 60_000,
    }
  );

  const result = await page.evaluate(async () => {
    const { __STORYBOOK_CLIENT_API__: api } = window as SBWindow;

    await api._storyStore?.cacheAllCSFFiles();

    return {
      stories: Object.values(api._storyStore?.extract() || {}).map(
        ({ id, story, kind }) => ({
          id,
          story,
          kind,
        })
      )!,
    };
  });

  if (variants === undefined || variants.length === 0) {
    variants = [
      {
        name: "",
        params: "",
      },
    ];
  }

  let current = 0;

  for (const story of result.stories!) {
    for (let variant of variants) {
      if (variant.params?.startsWith("?")) {
        variant.params = variant.params.substring(1);
      }
      if (!variant.params?.startsWith("&") && variant.params !== "") {
        variant.params = "&" + variant.params;
      }

      await page.goto(
        `${storybookURL}/iframe.html?id=${story.id}&viewMode=story${
          variant.params ? variant.params : ""
        }`,
        {
          waitUntil: "networkidle",
        }
      );

      const selector = "body";
      await page.waitForSelector(selector);

      await pixeleyeSnapshot(page, {
        name: story.id,
        variant: variant.name,
        selector,
        devices,
      });

      current += devices.length;

      callback?.({ current });
    }
  }

  await browser.close();
}
