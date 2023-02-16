import { build } from "esbuild";

build({
  entryPoints: ["index.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node14",
  external: ["commander", "sharp"],
  outfile: "out.js",
});
