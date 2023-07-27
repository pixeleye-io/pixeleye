import { promises as fs } from "fs";
import { join } from "path";
import program from "./commands";
import { Context, getAPI, uploadSnapshot } from "@pixeleye/js-sdk";

async function readAllFiles(path: string) {
  const dir = join(process.cwd(), path);

  // read all files in the directory

  return fs
    .readdir(dir, {
      withFileTypes: true,
    })
    .then((files) =>
      files.filter((file) => file.isFile() && file.name.endsWith(".png"))
    );
}

function decode(fileName: string) {
  console.log(fileName);
  const decoded = decodeURIComponent(fileName);

  const [name, variant] = decoded
    .split("--")
    .map((str) => str.trim())
    .map((str) => str.replaceAll("\\-", "-"));

  return {
    name: name!,
    variant: variant?.replace(/\.png$/, ""),
  };
}

interface Config {
  token: string;
  url: string;
}

async function upload(path: string, options: Config) {
  const ctx: Context = {
    env: process.env,
    endpoint: options.url,
    token: options.token,
  };

  const api = getAPI(ctx);

  ctx.api = api;

  await readAllFiles(path)
    .then(async (files) => {
      console.log(files);
      const snaps = await Promise.all(
        files.map((file) =>
          fs
            .readFile(join(process.cwd(), path, file.name))
            .then(async (buffer) => ({
              imageId: (await uploadSnapshot(ctx, buffer))?.id,
              name: file.name,
            }))
        )
      )

      console.log("done", snaps);

      return;

      // const sha = Math.random().toString(36).substring(7);
      // const visualSnapshots = snaps.map((snap) => {
      //   const { name, variant } = decode(snap.name);
      //   return {
      //     name,
      //     variant,
      //     imageId: snap.imageId,
      //   };
      // });

      // const branch = "main";

      // const targetSha = await client.getHeadBuild({
      //   branch,
      // });

      // console.log(targetSha, visualSnapshots);

      // await client.createBuild({
      //   visualSnapshots,
      //   sha,
      //   targetSha: targetSha?.sha,
      //   branch,
      //   title: "test title",
      //   message: "test commit message",
      //   pullRequestURL: "https://pixeleye.dev",
      // });

      // await client.createBuild({
      //   sha,
      //   branch: "test-branch",
      //   title: "test title",
      //   message: "test commit message",
      //   url: "https://pixeleye.dev",
      // });
    })
    .catch((err) => {
      if (err?.code === "ENOENT") {
        program.error(`No such directory: ${path}`, {
          code: "ENOENT",
          exitCode: 9,
        });
      }
      program.error(err);
    });
}

export default upload;
