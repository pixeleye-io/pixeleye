import { join, resolve } from "path";
import { readFile, readdir } from "fs/promises";
import { cache } from "react";
import { packageDirectory } from "pkg-dir";

export async function getFile(page: string[]) {
  const path = page.join("\\");

  const files = await getAllFiles();

  const file = files.find((f) => f.url === path);

  if (!file) {
    throw new Error("File not found");
  }

  return readFile(file.file, "utf-8");
}

interface DocsFile {
  file: string;
  url: string;
}

// TODO - add caching to this
export const getAllFiles = cache(async () => {
  const files: DocsFile[] = [];

  const root = await packageDirectory().then(
    (dir) => dir?.replace(/(apps\\marketing)(.*)/, "")
  ); 

  for await (const f of getFiles(join(root!, "docs"))) {
    files.push({
      file: f,
      url: f
        .replace(/(.*)(\\docs\\)/, "")
        .replace(".md", "")
        .replaceAll(/(\d\d-)/g, ""),
    });
  }

  return files;
});

export async function* getFiles(dir: string): AsyncGenerator<string> {
  const dirents = await readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* getFiles(res);
    } else {
      yield res;
    }
  }
}
