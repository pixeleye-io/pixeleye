import { build } from "@pixeleye/esbuild";

build(["./src/index.ts"], "./dist/index.js", ["playwright", "jsdom", "rrweb-snapshot/dist/rrweb-snapshot.min.js"]);