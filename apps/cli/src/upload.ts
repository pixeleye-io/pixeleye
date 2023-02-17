import { promises as fs } from "fs";
import { join } from "path";
import { createClient } from "@pixeleye/node";
import program from "./commands";

async function readAllFiles(path: string) {
  const dir = join(process.cwd(), path);

  // read all files in the directory

  return fs
    .readdir(dir, {
      withFileTypes: true,
    })
    .then((files) =>
      files.filter((file) => file.isFile() && file.name.endsWith(".png")),
    );
}

interface Config {
  secret: string;
  key: string;
  url: string;
}

async function upload(path: string, options: Config) {
  const client = createClient({
    credentials: {
      key: options.key,
      secret: options.secret,
    },
    url: options.url,
  });
  await readAllFiles(path)
    .then(async (files) => {
      console.log(files);
      const snaps = await Promise.all(
        files.map((file) =>
          fs
            .readFile(join(process.cwd(), path, file.name))
            .then(async (buffer) => await client.uploadImage(buffer)),
        ),
      );
      const ids = await Promise.all(
        snaps.map((hash) =>
          client.createSnapshot({
            name: "test" + Math.random(),
            hash,
          }),
        ),
      );

      await client.createBuild(ids);
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
