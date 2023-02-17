import { Blob } from "buffer";
import crypto from "crypto";
import fetch from "node-fetch";
import sharp from "sharp";
import { RouterType, api } from "./api";
import { generateHash } from "./image";

type API = ReturnType<typeof api>;

export function service(api: API) {
  function createUpload(hash: string) {
    return api.image.getUploadUrl.query({ hash });
  }

  type URLType = Exclude<
    Awaited<ReturnType<RouterType["image"]["getUploadUrl"]["query"]>>["data"],
    undefined
  >;

  function upload(file: Buffer, data: URLType, name: string) {
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

  const optimiseImage = (img: Buffer) =>
    sharp(img).png({ palette: true }).toBuffer();

  async function uploadImage(img: Buffer) {
    const optimisedImg = await optimiseImage(img);
    const hash = generateHash(optimisedImg);
    const { exists, data } = await createUpload(hash);
    if (!exists && data?.url) {
      upload(optimisedImg, data, hash);
    }
    return hash;
  }

  interface SnapshotData {
    name: string;
    variant?: string;
    hash: string;
    browser?: "CHROME" | "FIREFOX" | "SAFARI" | "EDGE";
  }

  const createSnapshot = (data: SnapshotData) =>
    api.snapshot.createSnapshot.mutate(data);

  async function createBuild(snapshotIds: string[]) {
    const sha = crypto.randomUUID();
    const build = await api.build.createBuild.mutate({
      sha,
      visualSnapshots: snapshotIds,
      commitMessage: "test" + Math.random(),
      branch: "test" + Math.random(),
    });
    return build;
  }

  return {
    uploadImage,
    upload,
    createUpload,
    createBuild,
    createSnapshot,
  };
}
