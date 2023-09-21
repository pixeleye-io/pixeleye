import { Browser, Page, ElementHandle, launch } from "puppeteer";
import "pptr-testing-library/extend";

export type App = {
  navigate(path: string): Promise<ElementHandle<Element>>;
  stop(): Promise<void>;
  browser: Browser;
  page: Page;
};

async function openBrowser() {
  let browser = await launch();
  let page = await browser.newPage();
  return { browser, page };
}

const port = 3012;

export async function start(): Promise<App> {
  const { browser, page } = await openBrowser();

  return {
    browser,
    page,
    async navigate(path: string) {
      let url = new URL(path, `http://localhost:${port}/`);
      await page.goto(url.toString());
      return await page.getDocument();
    },
    async stop() {
      await stop();
      await browser.close();
    },
  };
}
