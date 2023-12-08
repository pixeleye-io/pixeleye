import { Context, getAPI } from "../environment";
import { generateHash, getDimensions } from "../utils";
import { Blob } from "buffer";
import { fetch } from "undici";

export async function uploadSnapshots(
  ctx: Context,
  files: {
    file: Buffer;
    format: string;
  }[]
) {
  const api = getAPI(ctx);

  const snapshots: {
    height: number;
    width: number;
    format: string;
    hash: string;
    file: Buffer;
  }[] = [];

  await Promise.all(
    files.map(async ({ file, format }) => {
      const hash = generateHash(file);

      const { height, width } = await getDimensions(file);

      snapshots.push({
        hash,
        format,
        height,
        width,
        file,
      });
    })
  );

  const presignedMap = await api.post("/v1/client/snapshots/upload", {
    body: {
      snapshots: snapshots.map(({ hash, height, width, format }) => ({
        hash,
        height,
        width,
        format,
      })),
    },
  });

  const snapsToUpload = snapshots.filter((snapshot) =>
    Boolean(presignedMap[snapshot.hash].URL)
  );

  await Promise.all(
    snapsToUpload.map(({ file, hash, format }) => {
      const presigned = presignedMap[hash];

      const blob = new Blob([file], { type: format });

      return fetch(presigned.URL!, {
        method: presigned.Method,
        headers: {
          ...(presigned.SignedHeader
            ? { Host: presigned.SignedHeader.Host.join(",") }
            : {}),
          contentType: format,
        },
        body: blob,
      });
    })
  );

  return snapshots.map(({ hash }) => ({
    id: presignedMap[hash].id,
  }));
}
