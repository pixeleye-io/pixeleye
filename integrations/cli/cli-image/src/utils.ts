import { createHash } from "node:crypto";
import { promisify } from "node:util";
import sizeOf from "image-size";

const sizeOfPromise = promisify(sizeOf);

export function generateHash(img: string | Buffer) {
  const hash = createHash("sha1");

  return hash.update(img).digest("hex");
}

export const getDimensions = (img: Buffer) =>
  sizeOfPromise(img.toString()).then((image) => ({
    width: image?.width!,
    height: image?.height!,
  }));
