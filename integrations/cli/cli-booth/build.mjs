import { build } from "@pixeleye/esbuild";

build(["./src/index.ts"], "./dist/index.js", ["playwright", "jsdom"]);
