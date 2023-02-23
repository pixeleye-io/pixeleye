import crypto from "crypto";
import sharp from "sharp";

export function generateHash(img: Buffer) {
  const hash = crypto.createHash("sha256");

  return hash.update(img).digest("hex");
}

export const optimiseImage = (img: Buffer) =>
  sharp(img).png({ palette: true }).toBuffer();
