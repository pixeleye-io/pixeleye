import * as esbuild from "esbuild";


const forceExternal = [
  "jsdom",
  "playwright-core",
  "playwright-core/lib/server"
]

const makeAllPackagesExternalPlugin = {
  name: 'make-all-packages-external',
  setup(build) {
    const filter = /^[^.\/]|^\.[^.\/]|^\.\.[^\/]/ // Must not start with "/" or "./" or "../"
    build.onResolve({ filter }, args => {
      if (build.initialOptions.format === "cjs") return ({ external: forceExternal.includes(args.path) }); // Sorry npm but this means our cjs builds are massive
      { return ({ path: args.path, external: true }) }
    })
  },
}

const devBuild = process.argv.includes("--dev");

export function build(entryPoints, outdir, banner = {}, formats = ["cjs", "esm"]) {
  if (devBuild) formats = ["cjs"];
  formats.map((format) => {
    esbuild.build({
      entryPoints,
      banner,
      bundle: true,
      minify: false,
      platform: "node",
      target: "node20",
      external: devBuild ? ["jsdom", "playwright-core", "rrweb-snapshot/dist/rrweb-snapshot.min.js"] : [],
      outdir,
      format,
      outExtension: {
        ".js": format === "cjs" ? ".cjs" : ".js",
      },
      plugins: devBuild ? [] : [makeAllPackagesExternalPlugin],
    })
  });
}
