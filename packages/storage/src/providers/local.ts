import { StorageProvider } from "./types";

function getUploadUrl(hash: string) {
  return Promise.resolve({
    url: `${process.env.PIXELEYE_URL}/api/storage/image/${hash}`,
    fields: {},
  });
}

export default {
  getUploadUrl,
} as StorageProvider;
