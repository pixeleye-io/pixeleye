import { build } from "@pixeleye/esbuild";


build(["./src/index.ts"], "./bin", {
    js: `#! /usr/bin/env node\n`,
}, ["cjs"], true);

build(["./src/booth.ts"], "./bin", {
    js: `#! /usr/bin/env node\n`,
}, ["cjs"], true);
