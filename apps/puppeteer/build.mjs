import { build } from "@pixeleye/esbuild";

build(["./src/index.ts"], "./dist/index.js", ["puppeteer-core", "puppeteer", "canvas"]);

// build(["./src/tests/landing.ts"], "./dist-e2e/index.js");
