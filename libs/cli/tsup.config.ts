import { defineConfig } from "tsup";

export default defineConfig({
  platform: "node",
  format: ["cjs", "esm"],
  entryPoints: ["src/index.ts"],
  target: "node18",
  dts: true,
  bundle: true,
  external: [
    "@pixeleye/storybook",
    "@pixeleye/puppeteer",
    "@pixeleye/booth",
    "@pixeleye/js-sdk",
  ],
});
