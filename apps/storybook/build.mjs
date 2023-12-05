import { build } from "@pixeleye/esbuild";

build(["./src/index.ts"], "./dist/index.js", ["puppeteer-core", "puppeteer", "canvas", "@pixeleye/rrweb-snapshot"]);
