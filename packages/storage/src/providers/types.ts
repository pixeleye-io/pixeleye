interface UploadPost {
  url: string;
  fields: Record<string, string>;
}

export interface StorageProvider {
  getUploadUrl: (hash: string, teamId: string) => Promise<UploadPost>;
}
