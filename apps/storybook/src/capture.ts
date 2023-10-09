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
  port,
  endpoint,
  token,
}: {
  storybookURL: string;
  port: number;
  endpoint: string;
  token: string;
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

  for (const story of result.stories!) {
    await page.goto(
      `${storybookURL}/iframe.html?id=${story.id}&viewMode=story`,
      {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      }
    );

    await pixeleyeSnapshot(page, {
      name: story.id,
      browsers: ["chromium", "firefox", "webkit"],
      config: {
        endpoint,
        token,
        port,
      },
      viewports: ["1024x768"],
      fullPage: true,
    });
  }

  await browser.close();
}
