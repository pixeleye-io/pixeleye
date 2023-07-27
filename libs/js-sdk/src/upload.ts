import { Context, getAPI } from "./environment";
import { generateHash } from "./snaps";
import fetch from "node-fetch";
import { Blob } from "buffer";

export async function uploadSnapshot(ctx: Context, file: Buffer) {
  const api = getAPI(ctx);

  const hash = generateHash(file);

  const presigned = await api.post("/snapshots/upload/{hash}", {
    params: {
      hash,
    },
  });

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
