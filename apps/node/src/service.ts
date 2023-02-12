import { api } from "./api";
import { generateHash } from "./image";

export function createUpload(img: Buffer) {
  return api.image.createUpload({
    input: {
      hash: generateHash(img),
      data: img.toString("base64"),
    },
  });
}
