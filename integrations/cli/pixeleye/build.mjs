import { build } from "@pixeleye/esbuild";


build(["./src/index.ts"], "./bin", {
    js: `#! /usr/bin/env node\n`,
}, ["esm"], true);

build(["./src/booth.ts"], "./bin", {
    js: `#! /usr/bin/env node\n`,
}, ["esm"], true);
