import { pixeleyeSnapshot } from "@pixeleye/playwright";
import { SBWindow } from "./browser";
import { chromium } from "playwright-core";
import { DeviceDescriptor } from "@pixeleye/cli-devices";
import { logger } from "@pixeleye/cli-logger";

async function openBrowser() {
  const browser = await chromium.launch({
    headless: true,
  });
  const page = await browser.newPage();
  return { browser, page };
}

const timeout = <T>(prom: Promise<T>, time: number) => {
  let timer: NodeJS.Timeout;
  return Promise.race([
    prom,
    new Promise((_r, rej) => (timer = setTimeout(rej, time))),
  ]).finally(() => clearTimeout(timer));
};

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
      timeout: 120_000,
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
        ({ id, story, kind, parameters: { pixeleye } }) => ({
          id,
          story,
          kind,
          config: pixeleye,
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
      const storyConfig = story.config?.parameters?.pixeleye;

      if (storyConfig?.skip) continue;

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
          waitUntil: "domcontentloaded",
        }
      );

      await page.waitForFunction(
        () => (window as SBWindow).__STORYBOOK_PREVIEW__.channel,
        {
          timeout: 60_000,
        }
      );

      await timeout(
        page.evaluate(() => {
          const { channel } = (window as SBWindow).__STORYBOOK_PREVIEW__;

          return new Promise<void>((resolve) => {
            channel.on("storyRendered", () => {
              resolve();
            });
          });
        }),
        60_000
      ).catch(() => {
        logger.info(
          `Didn't receive storyRendered event for ${story.id} in 60s, attempting to capture anyway`
        );
      });

      await page.waitForLoadState("load", {
        timeout: 60_000,
      });

      await page
        .waitForFunction(() => document.fonts.ready)
        .catch(() => {
          logger.info(
            `Time out waiting for document fonts to be ready for ${story.id}`
          );
        });

      if (storyConfig?.selector)
        await page.waitForSelector(storyConfig.selector);

      await pixeleyeSnapshot(page, {
        name: story.id,
        variant: variant.name,
        selector: storyConfig?.selector,
        devices,
      });

      current += devices.length;

      callback?.({ current });
    }
  }

  await browser.close();
}
