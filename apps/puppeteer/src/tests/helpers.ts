import { Browser, Page, ElementHandle, launch } from "puppeteer";
// import "pptr-testing-library/extend";
import { execa } from "execa";
import getPort from "get-port";
import { start as startBooth } from "@pixeleye/booth";
import { Context, createBuild, getAPI } from "@pixeleye/js-sdk";

export type Process = {
  stop(): Promise<void>;
  port: number;
};

async function startBoothServer() {
  const port = await getPort(); // get a random post

  const ctx: Context = {
    env: process.env,
    endpoint: "http://localhost:5000",
    token: "",
  };

  getAPI(ctx);

  const build = await createBuild(ctx);

  // start the process with the database URL and generated port
  const server = await startBooth({
    build,
    port,
    endpoint: "http://localhost:5000",
    token: "",
  });

  return { port, stop: server.close };
}

async function startTestSite() {
  const port = await getPort(); // get a random post

  // start the process with the database URL and generated port
  const server = execa(
    "pnpm",
    ["turbo", "run", "--filter=test-site", "start"],
    {
      env: {
        port: port.toString(),
      },
    }
  );

  // here, we create a new promise, we'll expect for the stdout to receive
  // the message with the PORT our server generates once it starts listening
  return await new Promise<Process>(async (resolve, reject) => {
    server.catch((error) => reject(error));
    if (server.stdout === null) return reject("Failed to start server.");
    server.stdout.on("data", (stream: Buffer) => {
      console.log("stream", stream.toString());
      if (stream.toString().includes(port.toString())) {
        return resolve({
          async stop() {
            if (server.killed) return;
            server.cancel();
          },
          port,
        });
      }
    });
  });
}

export type App = {
  navigate(path: string): Promise<void>;
  stop(): Promise<void>;
  browser: Browser;
  page: Page;
  boothPort: number;
};

async function openBrowser() {
  const browser = await launch({
    headless: "new",
  });
  const page = await browser.newPage();
  return { browser, page };
}

export async function start(): Promise<App> {
  const [
    { browser, page },
    { stop: stopTestSite, port: testSitePort },
    { stop: stopBooth, port: boothPort },
  ] = await Promise.all([openBrowser(), startTestSite(), startBoothServer()]);

  return {
    browser,
    page,
    boothPort,
    navigate: async (path: string) => {
      let url = new URL(path, `http://127.0.0.1:${testSitePort}/`);
      await page.goto(url.toString());
    },
    stop: async () => {
      await stopBooth();
      await stopTestSite();
      await browser.close();
    },
  };
}
