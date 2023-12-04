import { Browser, Page, launch } from "puppeteer";

export type App = {
  navigate(path: string): Promise<void>;
  stop(): Promise<void>;
  browser: Browser;
  page: Page;
};

async function openBrowser() {
  const browser = await launch({
    headless: "new",
  });
  const page = await browser.newPage();
  return { browser, page };
}

export async function start(): Promise<App> {
  const { browser, page } = await openBrowser();

  return {
    browser,
    page,
    navigate: async (path: string) => {
      let url = new URL(path, `https://syntax.pixeleye.io`);
      await page.goto(url.toString());
    },
    stop: async () => {
      await browser.close();
    },
  };
}
