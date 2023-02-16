import { Blob } from "buffer";
import fetch from "node-fetch";
import sharp from "sharp";
import { RouterType, api } from "./api";
import { generateHash } from "./image";

export function createUpload(hash: string) {
  return api.snapshot.getImageUploadUrl.query({ hash });
}

type DataType = Exclude<
  Awaited<
    ReturnType<RouterType["snapshot"]["getImageUploadUrl"]["query"]>
  >["data"],
  undefined
>;

export function upload(file: Buffer, data: DataType, name: string) {
  const formData = new FormData();

  Object.entries(data.fields).forEach(([key, value]) => {
    formData.append(key, value as unknown as string);
  });

  const blob = new Blob([file], { type: "image/png" });

  formData.append("file", blob as any, `${name}.png`);

  return fetch(data.url, {
    method: "POST",
    body: formData,
  });
}

export const optimiseImage = (img: Buffer) =>
  sharp(img).png({ palette: true }).toBuffer();

export async function uploadImage(img: Buffer) {
  const optimisedImg = await optimiseImage(img);
  const hash = generateHash(optimisedImg);
  const { exists, data } = await createUpload(hash);
  if (!exists && data?.url) {
    return upload(optimisedImg, data, hash);
  }
}
