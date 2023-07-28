import * as esbuild from "esbuild";

export function build(entryPoints, outfile) {
  esbuild.build({
    entryPoints,
    bundle: true,
    banner: {
      // js: `#!/usr/bin/env node`,
    },
    platform: "node",
    target: "node18",
    outfile,
  });
}
