import { pixeleyeSnapshot } from "@pixeleye/puppeteer";
import { getStoriesInternal } from "./browser";
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
}: {
  storybookURL: string;
}) {
  const { browser, page } = await openBrowser();

  await page.goto(storybookURL);

  const stories = await page.evaluate(getStoriesInternal);

  for (const story of stories) {
    await page.goto(`${storybookURL}/iframe.html?id=${story.id}`);
    await pixeleyeSnapshot(page, {
      name: story.name,
      browsers: ["chromium", "firefox", "webkit"],
    });
  }

  await browser.close();
}
