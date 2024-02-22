import { build } from "@pixeleye/esbuild";
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';


build(["./src/index.ts"], "./bin/index.js", ["playwright-core", "playwright-core", "jsdom", "rrweb-snapshot/dist/rrweb-snapshot.min.js"], {
    js: `#! /usr/bin/env node\n`,
});

build(["./src/booth.ts"], "./bin/booth.js", ["playwright-core", "jsdom", "rrweb-snapshot/dist/rrweb-snapshot.min.js"], {
    js: `#! /usr/bin/env node\n`,
});
