import { ImageType, StorageProvider } from "./types";

function getUploadUrl(hash: string, type: ImageType, projectId?: string) {
  return Promise.resolve({
    url: `${process.env.PIXELEYE_URL}/api/storage/image/${hash}`,
    fields: {},
  });
}

export default {
  getUploadUrl,
} as StorageProvider;
