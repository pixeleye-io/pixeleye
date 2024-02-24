import * as esbuild from "esbuild";

const makeAllPackagesExternalPlugin = {
  name: 'make-all-packages-external',
  setup(build) {
    let filter = /^[^.\/]|^\.[^.\/]|^\.\.[^\/]/ // Must not start with "/" or "./" or "../"
    build.onResolve({ filter }, args => ({ path: args.path, external: true }))
  },
}

export function build(entryPoints, outdir, banner = {}, formats = ["cjs", "esm"]) {
  formats.map((format) => {
    esbuild.build({
      entryPoints,
      banner,
      bundle: true,
      minify: true,
      platform: "node",
      target: "node20",
      outdir,
      format,
      outExtension: {
        ".js": format === "cjs" ? ".cjs" : ".mjs",
      },
      plugins: [makeAllPackagesExternalPlugin],
    })
  });
}
