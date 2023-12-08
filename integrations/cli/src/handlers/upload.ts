// import fsCallback from "graceful-fs";
// import { promisify } from "util";
// import { join } from "path";
// import {
//   Context,
//   completeBuild,
//   createBuild,
//   getAPI,
//   linkSnapshotsToBuild,
//   splitIntoChunks,
//   uploadSnapshots,
// } from "@pixeleye/js-sdk";
// import { PartialSnapshot } from "@pixeleye/api";
// import { program } from "commander";
// import ora from "ora";
// import { dirNotFound, noImagesFound } from "../messages/files";
// import { noParentBuildFound } from "../messages/builds";

// const fs = {
//   readdir: promisify(fsCallback.readdir),
//   readFile: promisify(fsCallback.readFile),
// };

// async function readAllFiles(path: string) {
//   const dir = join(process.cwd(), path);

//   // read all files in the directory

//   return fs
//     .readdir(dir, {
//       withFileTypes: true,
//     })
//     .then((files) =>
//       files.filter((file) => file.isFile() && file.name.endsWith(".png"))
//     );
// }

// function decode(fileName: string) {
//   const decoded = decodeURIComponent(fileName);

//   const [name, variant] = decoded
//     .split("--")
//     .map((str) => str.trim())
//     .map((str) => str.replaceAll("\\-", "-"));

//   return {
//     name: name!,
//     variant: variant?.replace(/\.png$/, ""),
//   };
// }

// interface Config {
//   token: string;
//   endpoint: string;
// }

// export async function upload(path: string, options: Config) {
//   const ctx: Context = {
//     env: process.env,
//     endpoint: options.endpoint,
//     token: options.token,
//   };

//   getAPI(ctx);

//   const fileSpinner = ora("Reading files").start();

//   const files = await readAllFiles(path).catch((err) => {
//     fileSpinner.fail("Failed to read files.");
//     if (err?.code === "ENOENT") {
//       dirNotFound(path);
//       process.exit(9);
//     }
//     program.error(err);
//   });

//   if (!files || files.length === 0) {
//     fileSpinner.fail("Failed to read files.");
//     noImagesFound(path);
//     process.exit(9);
//   }

//   fileSpinner.succeed("Successfully read files.");

//   const buildSpinner = ora("Creating build").start();

//   const build = await createBuild(ctx).catch((err) => {
//     buildSpinner.fail("Failed to create build.");
//     console.log(err);
//     program.error(err);
//   });

//   if (!build.parentBuildIDs) {
//     noParentBuildFound();
//   }

//   buildSpinner.succeed("Successfully created build.");

//   const uploadSpinner = ora("Uploading snapshots to Pixeleye...").start();

//   // TODO - we can and should upload + link snapshots in batches so we can begin processing them in the background

//   const groups = splitIntoChunks(files, 20);

//   const snaps: {
//     imageId: string;
//     name: string;
//   }[] = [];

//   try {
//     for (const files of groups) {
//       const readFiles = await Promise.all(
//         files.map(async (f) => ({
//           file: await fs.readFile(join(process.cwd(), path, f.name)),
//           format: "image/png",
//           name: f.name,
//         }))
//       );

//       snaps.push(
//         ...(await uploadSnapshots(ctx, readFiles).then((res) => {
//           return res.map((snap) => ({
//             imageId: snap.id,
//             name: snap.name,
//           }));
//         }))
//       );
//     }
//   } catch (err: any) {
//     uploadSpinner.fail("Failed to upload snapshots to Pixeleye.");
//     console.log(err);
//     program.error(err);
//   }

//   uploadSpinner.succeed("Successfully uploaded snapshots to Pixeleye.");

//   uploadSpinner.start("Linking snapshots to build...");

//   const snapshots: PartialSnapshot[] = snaps.map((snap) => ({
//     snapID: snap.imageId,
//     name: decode(snap.name).name,
//     variant: decode(snap.name).variant,
//   }));

//   await linkSnapshotsToBuild(ctx, build, snapshots).catch((err) => {
//     uploadSpinner.fail("Failed to link snapshots to build.");
//     console.log(err);
//     program.error(err);
//   });

//   uploadSpinner.succeed("Successfully linked snapshots to build.");

//   const completeSpinner = ora("Completing build...").start();

//   await completeBuild(ctx, build).catch((err) => {
//     completeSpinner.fail("Failed to complete build.");
//     console.log(err);
//     program.error(err?.toString() || err);
//   });

//   completeSpinner.succeed("Successfully completed build.");

//   console.log(`Build ${build.id} successfully uploaded to Pixeleye.`);
// }

// export default upload;
