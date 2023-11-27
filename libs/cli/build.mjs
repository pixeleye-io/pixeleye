import { build } from "@pixeleye/esbuild";

build(["./src/index.ts"], "./bin/index.js", ["jsdom", "playwright"], {
    js: `#! /usr/bin/env node\n`,
});
