import * as esbuild from "esbuild";




export function build(entryPoints, outfile, external = [], banner = {}) {
  esbuild.build({
    entryPoints,
    // loader: { ".node": "file" },
    banner,
    bundle: true,
    platform: "node",
    target: "node18",
    outfile,
    external,

  });
}
