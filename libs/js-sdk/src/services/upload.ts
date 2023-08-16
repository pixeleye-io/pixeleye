import { Context, getAPI } from "../environment";
import { generateHash, getDimensions } from "../utils";
import { Blob } from "buffer";
import { fetch } from "undici";

export async function uploadSnapshot(
  ctx: Context,
  file: Buffer,
  format: string
) {
  const api = getAPI(ctx);

  const hash = generateHash(file);

  const { height, width } = await getDimensions(file);

  const presignedMap = await api.post("/client/snapshots/upload", {
    body: {
      snapshots: [
        {
          hash,
          format,
          height,
          width,
        },
      ],
    },
  });

  const presigned = presignedMap[hash];

  // It's already been uploaded
  if (!presigned.URL) {
    return presigned;
  }

  const blob = new Blob([file], { type: format });

  await fetch(presigned.URL, {
    method: presigned.Method,
    headers: {
      ...(presigned.SignedHeader
        ? { Host: presigned.SignedHeader.Host.join(",") }
        : {}),
      contentType: format,
    },
    body: blob,
  });

  return presigned;
}
