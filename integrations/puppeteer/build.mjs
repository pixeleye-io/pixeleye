import { build } from "@pixeleye/esbuild";

build(["./src/index.ts"], "./dist/index.js", ["puppeteer-core", "puppeteer", "playwright", "jsdom", "rrweb-snapshot/dist/rrweb-snapshot.min.js"]);

// build(["./src/tests/landing.ts"], "./dist-e2e/index.js");
