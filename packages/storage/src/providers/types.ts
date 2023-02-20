interface UploadPost {
  url: string;
  fields: Record<string, string>;
  endpoint: string;
}

export interface StorageProvider {
  getUploadUrl: (hash: string, projectId: string) => Promise<UploadPost>;
}
