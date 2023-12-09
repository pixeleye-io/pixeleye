import { build } from "@pixeleye/esbuild";

build(["./src/index.ts"], "./bin/index.js", ["playwright", "jsdom", "rrweb-snapshot/dist/rrweb-snapshot.min.js"], {
    js: `#! /usr/bin/env node\n`,
});

build(["./src/booth.ts"], "./bin/booth.js", ["playwright", "jsdom", "rrweb-snapshot/dist/rrweb-snapshot.min.js"], {
    js: `#! /usr/bin/env node\n`,
});
