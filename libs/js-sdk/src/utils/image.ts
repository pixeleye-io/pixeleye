import crypto from "crypto";
import jimp from "jimp";

export function generateHash(img: string | Buffer) {
  const hash = crypto.createHash("sha1");

  return hash.update(img).digest("hex");
}

export const getDimensions = (img: Buffer) =>
  jimp.read(img).then((image) => ({
    width: image.getWidth(),
    height: image.getHeight(),
  }));

export const convertImage = (img: Buffer) =>
  jimp.read(img).then((image) => image.getBufferAsync(jimp.MIME_PNG));
