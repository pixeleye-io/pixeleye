import { Context, getAPI } from "../environment";
import { generateHash } from "../utils";
import { Blob } from "buffer";
import { fetch } from "undici"

export async function uploadSnapshot(ctx: Context, file: Buffer) {
  const api = getAPI(ctx);

  const hash = generateHash(file);

  const presigned = await api.post("/client/snapshots/upload/{hash}", {
    params: {
      hash,
    },
  });

  // It's already been uploaded
  if (!presigned.URL) {
    return presigned;
  }

  const blob = new Blob([file], { type: "image/png" });

  await fetch(presigned.URL, {
    method: presigned.Method,
    headers: {
      ...(presigned.SignedHeader
        ? { Host: presigned.SignedHeader.Host.join(",") }
        : {}),
      contentType: "image/png",
    },
    body: blob,
  });

  return presigned;
}
