import crypto from "crypto";
import jimp from "jimp";

const hash = crypto.createHash("sha256");

export function generateHash(img: Buffer) {
  return hash.update(img).digest("hex");
}

export const convertImage = (img: Buffer) =>
  jimp.read(img).then((image) => image.getBufferAsync(jimp.MIME_PNG));
