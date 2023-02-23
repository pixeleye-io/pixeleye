interface UploadPost {
  url: string;
  fields: Record<string, string>;
  endpoint: string;
}

export type ImageType = "snap" | "diff";

export interface StorageProvider {
  getUploadUrl: (
    hash: string,
    type: ImageType,
    projectId?: string,
  ) => Promise<UploadPost>;
}
