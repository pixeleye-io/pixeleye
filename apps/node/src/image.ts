import crypto from "crypto";

const hash = crypto.createHash("sha256");

export function generateHash(img: Buffer) {
  return hash.update(img).digest("hex");
}
