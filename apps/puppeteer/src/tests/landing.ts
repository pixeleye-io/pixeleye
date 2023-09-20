import puppeteer from "puppeteer";
import { pixeleyeSnapshot } from "../snapshot";


async function main() {
const browser = await puppeteer.launch({ headless: false });
const page = await browser.newPage();
const timeout = 5000;
page.setDefaultTimeout(timeout);

try {
  await page.goto("http://localhost:3012");

  // @ts-ignore
  await pixeleyeSnapshot(page, {
    name: "landing",
  });
} catch (err) {
  console.log(err);
} finally {
  await browser.close();
}
}

main()


