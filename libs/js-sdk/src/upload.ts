import { Context, getAPI } from "./environment";
import { generateHash } from "./snaps";
import fetch from "node-fetch";
import { Blob } from "buffer";
import FormData from "form-data";

export async function uploadSnapshot(ctx: Context, file: Buffer) {
  const api = getAPI(ctx);

  const hash = generateHash(file);

  const presigned = await api.post("/snapshots/upload/{hash}", {
    params: {
      hash,
    },
  });

  console.log(presigned);

  if (!presigned.URL) {
    return presigned;
  }

  const formData = new FormData();

  if (presigned.Fields)
    Object.entries(presigned.Fields).forEach(([key, value]) => {
      formData.append(key, value as unknown as string);
    });

  // const blob = new Blob([file], { type: "image/png" });

  console.log("has", hash);

  formData.append("file", file, {
    filename: `${hash}.png`,
    contentType: "image/png",
  });

  await fetch(presigned.URL, {
    method: presigned.Method,
    headers: {
      ...(presigned.SignedHeader
        ? { Host: presigned.SignedHeader.Host.join(",") }
        : {}),
      contentType: "multipart/form-data",
    },
    body: formData,
  }).catch((err) => {
    console.log("some error idk", err.message);
    throw err;
  });

  return presigned;
}
