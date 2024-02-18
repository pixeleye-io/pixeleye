import * as esbuild from "esbuild";

export function build(entryPoints, outfile, external = [], banner = {}) {
  esbuild.build({
    entryPoints,
    banner,
    bundle: true,
    platform: "node",
    target: "node20",
    outfile,
    external
  });
}
