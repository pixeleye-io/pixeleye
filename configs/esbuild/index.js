import * as esbuild from "esbuild";


export function build(entryPoints, outfile, external = []) {
  esbuild.build({
    entryPoints,
    // loader: { ".node": "file" },
    bundle: true,
    platform: "node",
    target: "node18",
    outfile,
    external,
  });
}
