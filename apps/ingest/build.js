import fs from "fs";
import { build } from "esbuild";

fs.copyFileSync(
  "../../packages/db/prisma/schema.prisma",
  "./dist/schema.prisma",
);

build({
  entryPoints: ["index.ts"],
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "node14",
  external: ["@bull-board/api", "@prisma/client", "odiff-bin", "sharp"],
  outfile: "dist/out.cjs",
});
