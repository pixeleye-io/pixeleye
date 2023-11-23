import { PresignedURL, SnapImage } from "@pixeleye/api";
import { Context, getAPI } from "../environment";
import { generateHash, getDimensions, splitIntoChunks } from "../utils";
import { Blob } from "buffer";
import { fetch } from "undici";

export async function uploadSnapshot(
  ctx: Context,
  files: {
    file: Buffer;
    format: string;
    name: string;
  }[]
) {
  const api = getAPI(ctx);

  const snapshots: {
    height: number;
    width: number;
    format: string;
    hash: string;
    file: Buffer;
    name: string;
  }[] = [];

  await Promise.all(
    files.map(async ({ file, format, name }) => {
      const hash = generateHash(file);

      const { height, width } = await getDimensions(file);

      snapshots.push({
        hash,
        format,
        height,
        width,
        file,
        name,
      });
    })
  );

  const presignedMap = await api.post("/client/snapshots/upload", {
    body: {
      snapshots: snapshots.map(({ hash, height, width, format }) => ({
        hash,
        height,
        width,
        format,
      })),
    },
  });

  const snapsToUpload = snapshots.filter(
    (snapshot) => presignedMap[snapshot.hash].URL
  );

  console.log(
    snapshots.length - snapsToUpload.length,
    "snapshots already exist"
  );

  const chunks = splitIntoChunks(snapsToUpload, 5);

  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(({ file, hash, format }) => {
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
  }

  return snapshots.map(({ name, hash }) => ({
    name,
    id: presignedMap[hash].id,
  }));
}
