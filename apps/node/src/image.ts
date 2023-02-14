import crypto from "crypto";

export function generateHash(img: Buffer) {
  const hash = crypto.createHash("sha256");

  return hash.update(img).digest("hex");
}
