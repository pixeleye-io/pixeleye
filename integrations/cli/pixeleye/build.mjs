import { build } from "@pixeleye/esbuild";


build(["./src/index.ts"], "./bin", {
    js: `#! /usr/bin/env node\n`,
}, ["mjs"]);

build(["./src/booth.ts"], "./bin", {
    js: `#! /usr/bin/env node\n`,
}, ["mjs"]);
