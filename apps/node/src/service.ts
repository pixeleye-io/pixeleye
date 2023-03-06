import { Blob } from "buffer";
import fetch from "node-fetch";
import { RouterInput, RouterType, api } from "./api";
import { generateHash, optimiseImage } from "./image";

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

  async function uploadImage(img: Buffer) {
    const optimisedImg = await optimiseImage(img);
    const hash = generateHash(optimisedImg);
    const { exists, data, imageId } = await createUpload(hash);
    if (!exists && data?.url) {
      await upload(optimisedImg, data, hash);
    }
    return imageId;
  }

  const createSnapshot = (data: RouterInput["snapshot"]["createSnapshot"]) =>
    api.snapshot.createSnapshot.mutate(data);

  const createBuild = (data: RouterInput["build"]["createBuild"]) =>
    api.build.createBuild.mutate(data);

  const createReport = (data: RouterInput["build"]["createReport"]) =>
    api.build.createReport.mutate(data);

  return {
    uploadImage,
    upload,
    createSnapshot,
    createUpload,
    createBuild,
    createReport,
  };
}
