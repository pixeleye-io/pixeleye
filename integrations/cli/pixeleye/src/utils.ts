import { createHash } from "node:crypto";
import { read, MIME_PNG } from "jimp";

export function generateHash(img: string | Buffer) {
  const hash = createHash("sha1");

  return hash.update(img).digest("hex");
}

export const getDimensions = (img: Buffer) =>
  read(img).then((image) => ({
    width: image.getWidth(),
    height: image.getHeight(),
  }));

export const convertImage = (img: Buffer) =>
  read(img).then((image) => image.getBufferAsync(MIME_PNG));

