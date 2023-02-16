import { promises as fs } from "fs";
import { join } from "path";
import { uploadImage } from "@pixeleye/node";
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

async function upload(path: string) {
  await readAllFiles(path)
    .then(async (files) => {
      console.log(files);
      await Promise.all([
        files.map((file) =>
          fs.readFile(join(process.cwd(), path, file.name)).then((buffer) => {
            // console.log(buffer);
            uploadImage(buffer);
          }),
        ),
      ]);
    })
    .catch((err) => {
      if (err?.code === "ENOENT") {
        program.error(`No such directory: ${path}`, {
          code: "ENOENT",
          exitCode: 9,
        });
      }
    });
}

export default upload;
