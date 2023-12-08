import { pixeleyeSnapshot } from "@pixeleye/puppeteer";
import { SBWindow } from "./browser";
import { launch } from "puppeteer";

async function openBrowser() {
  const browser = await launch({
    headless: "new",
  });
  const page = await browser.newPage();
  return { browser, page };
}

export async function captureStories({
  storybookURL,
  variants,
}: {
  storybookURL: string;
  variants?: { name: string; params?: string }[];
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
        }`
      );

      await page.waitForSelector("#storybook-root");

      await pixeleyeSnapshot(page, {
        name: story.id,
        variant: variant.name,
        selector: "#storybook-root > *",
      });
    }
  }

  await browser.close();
}
